import { supabase } from '../lib/supabase';
import { Offer } from '../types';

type NamedRelation = { name: string } | { name: string }[] | null;

interface OfferRow {
  id: string;
  name: string;
  type: 'Percentage' | 'Flat';
  discount: number | string;
  category_id: string | null;
  product_id: string | null;
  start_date: string;
  end_date: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
  category: NamedRelation;
  products: NamedRelation;
}

export type CreateOfferInput = Omit<Offer, 'id'>;
export type UpdateOfferInput = Partial<Omit<Offer, 'id'>>;

const toDatabaseDate = (date: string): string => {
  if (!date) throw new Error('Offer date is required.');
  const parts = date.split('-');
  if (parts.length !== 3) throw new Error(`Invalid date: ${date}`);
  return parts[0].length === 4 ? date : `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const toFrontendDate = (date: string): string => {
  if (!date) return '';
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  return parts[0].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : date;
};

const relationName = (relation: NamedRelation): string | undefined => {
  if (!relation) return undefined;
  if (Array.isArray(relation)) return relation[0]?.name;
  return relation.name;
};

const mapOfferRow = (row: OfferRow): Offer => ({
  id: row.id,
  name: row.name,
  type: row.type,
  discount: Number(row.discount),
  startDate: toFrontendDate(row.start_date),
  endDate: toFrontendDate(row.end_date),
  status: row.status,
  categoryId: row.category_id ?? undefined,
  categoryName: relationName(row.category),
  productId: row.product_id ?? undefined,
  productName: relationName(row.products),
});

const OFFER_SELECT = `
  id,
  name,
  type,
  discount,
  category_id,
  product_id,
  start_date,
  end_date,
  status,
  created_at,
  updated_at,
  category:category_id (name),
  products:product_id (name)
`;

const validateOffer = (offer: Partial<CreateOfferInput>): void => {
  if (offer.name !== undefined && !offer.name.trim()) throw new Error('Offer name is required.');
  if (offer.discount !== undefined) {
    const discount = Number(offer.discount);
    if (!Number.isFinite(discount) || discount < 0) throw new Error('Discount must be zero or greater.');
    if (offer.type === 'Percentage' && discount > 100) throw new Error('Percentage discount cannot exceed 100%.');
  }
  if (offer.startDate && offer.endDate && toDatabaseDate(offer.endDate) < toDatabaseDate(offer.startDate)) {
    throw new Error('End date cannot be before the start date.');
  }
};

export const getOffers = async (): Promise<Offer[]> => {
  const { data, error } = await supabase.from('offers').select(OFFER_SELECT).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as OfferRow[]).map(mapOfferRow);
};

export const createOffer = async (offer: CreateOfferInput): Promise<Offer> => {
  validateOffer(offer);
  const { data, error } = await supabase
    .from('offers')
    .insert({
      name: offer.name.trim(),
      type: offer.type,
      discount: Number(offer.discount),
      category_id: offer.categoryId || null,
      product_id: offer.productId || null,
      start_date: toDatabaseDate(offer.startDate),
      end_date: toDatabaseDate(offer.endDate),
      status: offer.status,
    })
    .select(OFFER_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return mapOfferRow(data as unknown as OfferRow);
};

export const updateOfferById = async (id: string, updates: UpdateOfferInput): Promise<Offer> => {
  if (!id) throw new Error('Offer ID is required.');
  validateOffer(updates);
  const db: Record<string, unknown> = {};
  if (updates.name !== undefined) db.name = updates.name.trim();
  if (updates.type !== undefined) db.type = updates.type;
  if (updates.discount !== undefined) db.discount = Number(updates.discount);
  if (updates.categoryId !== undefined) db.category_id = updates.categoryId || null;
  if (updates.productId !== undefined) db.product_id = updates.productId || null;
  if (updates.startDate !== undefined) db.start_date = toDatabaseDate(updates.startDate);
  if (updates.endDate !== undefined) db.end_date = toDatabaseDate(updates.endDate);
  if (updates.status !== undefined) db.status = updates.status;
  if (!Object.keys(db).length) throw new Error('No offer changes were provided.');
  const { data, error } = await supabase.from('offers').update(db).eq('id', id).select(OFFER_SELECT).single();
  if (error) throw new Error(error.message);
  return mapOfferRow(data as unknown as OfferRow);
};

export const deleteOfferById = async (id: string): Promise<void> => {
  const { error } = await supabase.from('offers').delete().eq('id', id);
  if (error) throw new Error(error.message);
};