import { supabase } from '../lib/supabase';
import { ComboDealItem, ComboOffer } from '../types';

type ProductRelation = { name: string } | { name: string }[] | null;

type ComboItemRow = {
  product_id: string;
  quantity: number | string;
  products: ProductRelation;
};

type ComboRow = {
  id: string;
  name: string;
  price: number | string;
  discount: number | string;
  image: string | null;
  start_date: string;
  end_date: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  combo_deal_items: ComboItemRow[] | null;
};

export type CreateComboInput = Omit<ComboOffer, 'id'>;
export type UpdateComboInput = Partial<Omit<ComboOffer, 'id'>>;

const dbDate = (value: string): string => {
  const p = value.split('-');
  if (p.length !== 3) throw new Error('Invalid combo date.');
  return p[0].length === 4 ? value : `${p[2]}-${p[1]}-${p[0]}`;
};

const uiDate = (value: string): string => {
  const p = value.split('-');
  return p.length === 3 && p[0].length === 4 ? `${p[2]}-${p[1]}-${p[0]}` : value;
};

const productName = (relation: ProductRelation): string => {
  if (!relation) return 'Product';
  return Array.isArray(relation) ? relation[0]?.name ?? 'Product' : relation.name;
};

const COMBO_SELECT = `
  id,
  name,
  price,
  discount,
  image,
  start_date,
  end_date,
  status,
  created_at,
  combo_deal_items (
    product_id,
    quantity,
    products:product_id (name)
  )
`;

const mapCombo = (row: ComboRow): ComboOffer => {
  const productItems: ComboDealItem[] = (row.combo_deal_items ?? []).map(item => ({
    productId: item.product_id,
    productName: productName(item.products),
    quantity: Number(item.quantity),
  }));
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    discount: Number(row.discount),
    image: row.image ?? '',
    startDate: uiDate(row.start_date),
    endDate: uiDate(row.end_date),
    status: row.status,
    productItems,
    productsIncluded: productItems.map(item => item.quantity > 1 ? `${item.quantity} x ${item.productName}` : item.productName),
  };
};

const validate = (combo: Partial<CreateComboInput>): void => {
  if (combo.name !== undefined && !combo.name.trim()) throw new Error('Combo name is required.');
  if (combo.price !== undefined && (!Number.isFinite(Number(combo.price)) || Number(combo.price) < 0)) throw new Error('Combo price must be zero or greater.');
  if (combo.discount !== undefined && (!Number.isFinite(Number(combo.discount)) || Number(combo.discount) < 0 || Number(combo.discount) > 100)) throw new Error('Combo discount must be between 0 and 100.');
  if (combo.productItems && combo.productItems.length < 2) throw new Error('Select at least two products for a combo deal.');
};

export const getCombos = async (): Promise<ComboOffer[]> => {
  const { data, error } = await supabase.from('combo_deals').select(COMBO_SELECT).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ComboRow[]).map(mapCombo);
};

export const createCombo = async (combo: CreateComboInput): Promise<ComboOffer> => {
  validate(combo);
  const { data, error } = await supabase.from('combo_deals').insert({
    name: combo.name.trim(),
    price: Number(combo.price),
    discount: Number(combo.discount),
    image: combo.image || null,
    start_date: dbDate(combo.startDate),
    end_date: dbDate(combo.endDate),
    status: combo.status,
  }).select('id').single();
  if (error) throw new Error(error.message);
  const items = combo.productItems ?? [];
  const { error: itemError } = await supabase.from('combo_deal_items').insert(items.map(item => ({
    combo_id: data.id,
    product_id: item.productId,
    quantity: item.quantity,
  })));
  if (itemError) {
    await supabase.from('combo_deals').delete().eq('id', data.id);
    throw new Error(itemError.message);
  }
  const { data: saved, error: readError } = await supabase.from('combo_deals').select(COMBO_SELECT).eq('id', data.id).single();
  if (readError) throw new Error(readError.message);
  return mapCombo(saved as unknown as ComboRow);
};

export const updateComboById = async (id: string, combo: UpdateComboInput): Promise<ComboOffer> => {
  validate(combo);
  const db: Record<string, unknown> = {};
  if (combo.name !== undefined) db.name = combo.name.trim();
  if (combo.price !== undefined) db.price = Number(combo.price);
  if (combo.discount !== undefined) db.discount = Number(combo.discount);
  if (combo.image !== undefined) db.image = combo.image || null;
  if (combo.startDate !== undefined) db.start_date = dbDate(combo.startDate);
  if (combo.endDate !== undefined) db.end_date = dbDate(combo.endDate);
  if (combo.status !== undefined) db.status = combo.status;
  if (Object.keys(db).length) {
    const { error } = await supabase.from('combo_deals').update(db).eq('id', id);
    if (error) throw new Error(error.message);
  }
  if (combo.productItems !== undefined) {
    const { error: deleteError } = await supabase.from('combo_deal_items').delete().eq('combo_id', id);
    if (deleteError) throw new Error(deleteError.message);
    const { error: insertError } = await supabase.from('combo_deal_items').insert(combo.productItems.map(item => ({ combo_id: id, product_id: item.productId, quantity: item.quantity })));
    if (insertError) throw new Error(insertError.message);
  }
  const { data, error } = await supabase.from('combo_deals').select(COMBO_SELECT).eq('id', id).single();
  if (error) throw new Error(error.message);
  return mapCombo(data as unknown as ComboRow);
};

export const deleteComboById = async (id: string): Promise<void> => {
  const { error } = await supabase.from('combo_deals').delete().eq('id', id);
  if (error) throw new Error(error.message);
};