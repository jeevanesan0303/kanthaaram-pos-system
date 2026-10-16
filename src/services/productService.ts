import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface ProductDatabaseRow {
  id: string;
  name: string;
  category_id: string;
  description: string | null;
  price: number | string;
  purchase_price: number | string | null;
  stock: number | string | null;
  low_stock_alert: number | string | null;
  image: string | null;
  barcode: string | null;
  sku: string | null;
  tax: number | string | null;
  unit: string | null;
  status: Product['status'] | null;
  is_stock_item: boolean | null;
  created_at: string;
  updated_at: string;
  category:
    | { name: string }
    | Array<{ name: string }>
    | null;
}

export interface ProductCreateInput {
  name: string;
  categoryId: string;
  description: string;
  price: number;
  purchasePrice?: number;
  stock?: number;
  lowStockAlert?: number;
  image: string;
  barcode?: string;
  sku?: string;
  tax?: number;
  unit?: string;
  status?: Product['status'];
  isStockItem?: boolean;
}

export interface ProductUpdateInput {
  name?: string;
  categoryId?: string;
  description?: string;
  price?: number;
  purchasePrice?: number;
  stock?: number;
  lowStockAlert?: number;
  image?: string;
  barcode?: string;
  sku?: string;
  tax?: number;
  unit?: string;
  status?: Product['status'];
  isStockItem?: boolean;
}

const PRODUCT_SELECT = `
  id,
  name,
  category_id,
  description,
  price,
  purchase_price,
  stock,
  low_stock_alert,
  image,
  barcode,
  sku,
  tax,
  unit,
  status,
  is_stock_item,
  created_at,
  updated_at,
  category (
    name
  )
`;

const getCategoryName = (row: ProductDatabaseRow): string => {
  if (Array.isArray(row.category)) {
    return row.category[0]?.name || 'Uncategorised';
  }

  return row.category?.name || 'Uncategorised';
};

const mapProductFromDatabase = (row: ProductDatabaseRow): Product => ({
  id: row.id,
  name: row.name,
  categoryId: row.category_id,
  category: getCategoryName(row),
  description: row.description || '',
  price: Number(row.price),
  purchasePrice: Number(row.purchase_price ?? 0),
  stock: Number(row.stock ?? 0),
  lowStockAlert: Number(row.low_stock_alert ?? 0),
  image: row.image || '',
  barcode: row.barcode || '',
  sku: row.sku || '',
  tax: Number(row.tax ?? 0),
  unit: row.unit || 'Cup',
  status: row.status || 'Active',
  isStockItem: Boolean(row.is_stock_item),
  createdAt: row.created_at?.slice(0, 10),
  updatedAt: row.updated_at,
});

const convertError = (
  defaultMessage: string,
  errorMessage: string,
): Error => {
  if (errorMessage.includes('row-level security')) {
    return new Error(
      'You do not have permission to perform this Product action.',
    );
  }

  if (errorMessage.includes('violates foreign key constraint')) {
    return new Error('The selected category does not exist.');
  }

  return new Error(`${defaultMessage}: ${errorMessage}`);
};

const validateStock = (stock: number | undefined): void => {
  if (stock !== undefined && (!Number.isFinite(stock) || stock < 0)) {
    throw new Error('Product stock cannot be negative.');
  }
};

export const productService = {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      throw convertError('Unable to load products', error.message);
    }

    return ((data || []) as unknown as ProductDatabaseRow[])
      .map(mapProductFromDatabase);
  },

  async getById(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('id', id)
      .single();

    if (error) {
      throw convertError('Unable to load product', error.message);
    }

    return mapProductFromDatabase(data as unknown as ProductDatabaseRow);
  },

  async create(input: ProductCreateInput): Promise<Product> {
    const cleanName = input.name.trim();

    if (cleanName.length < 2) {
      throw new Error('Product name must have at least 2 characters.');
    }

    if (!input.categoryId) {
      throw new Error('Please select a valid category.');
    }

    if (!Number.isFinite(input.price) || input.price < 0) {
      throw new Error('Please enter a valid Product price.');
    }

    validateStock(input.stock);

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: cleanName,
        category_id: input.categoryId,
        description: input.description.trim() || null,
        price: input.price,
        purchase_price: Number(input.purchasePrice ?? 0),
        stock: Number(input.stock ?? 0),
        low_stock_alert: Number(input.lowStockAlert ?? 0),
        image: input.image.trim() || null,
        barcode: input.barcode?.trim() || null,
        sku: input.sku?.trim() || null,
        tax: Number(input.tax ?? 0),
        unit: input.unit?.trim() || 'Cup',
        status: input.status ?? 'Active',
        is_stock_item: Boolean(input.isStockItem),
      })
      .select(PRODUCT_SELECT)
      .single();

    if (error) {
      throw convertError('Unable to create product', error.message);
    }

    return mapProductFromDatabase(data as unknown as ProductDatabaseRow);
  },

  async update(id: string, input: ProductUpdateInput): Promise<Product> {
    validateStock(input.stock);

    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) {
      const cleanName = input.name.trim();
      if (cleanName.length < 2) {
        throw new Error('Product name must have at least 2 characters.');
      }
      updateData.name = cleanName;
    }

    if (input.categoryId !== undefined) {
      if (!input.categoryId) {
        throw new Error('Please select a valid category.');
      }
      updateData.category_id = input.categoryId;
    }

    if (input.description !== undefined) {
      updateData.description = input.description.trim() || null;
    }
    if (input.price !== undefined) updateData.price = input.price;
    if (input.purchasePrice !== undefined) updateData.purchase_price = input.purchasePrice;
    if (input.stock !== undefined) updateData.stock = input.stock;
    if (input.lowStockAlert !== undefined) updateData.low_stock_alert = input.lowStockAlert;
    if (input.image !== undefined) updateData.image = input.image.trim() || null;
    if (input.barcode !== undefined) updateData.barcode = input.barcode.trim() || null;
    if (input.sku !== undefined) updateData.sku = input.sku.trim() || null;
    if (input.tax !== undefined) updateData.tax = input.tax;
    if (input.unit !== undefined) updateData.unit = input.unit.trim() || 'Cup';
    if (input.status !== undefined) updateData.status = input.status;
    if (input.isStockItem !== undefined) updateData.is_stock_item = input.isStockItem;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select(PRODUCT_SELECT)
      .single();

    if (error) {
      throw convertError('Unable to update product', error.message);
    }

    return mapProductFromDatabase(data as unknown as ProductDatabaseRow);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw convertError('Unable to delete product', error.message);
    }
  },
};
