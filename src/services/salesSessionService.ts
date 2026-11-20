import { supabase } from '../lib/supabase';
import type { Order, Product } from '../types';

export const SALES_TIME_ZONE = 'Asia/Colombo';

export interface ClosingOrder {
  database_id: string;
  order_number: string;
  created_at: string;
  order_type: Order['type'];
  payment_method: Order['paymentMethod'];
  payment_status: Order['paymentStatus'];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface ClosingSnapshot {
  version: number;
  timestamp_basis: string;
  timezone: string;
  captured_at: string;
  completed_orders: number;
  paid_orders: number;
  pending_orders: number;
  refunded_orders: number;
  paid_revenue: number;
  discount: number;
  orders: ClosingOrder[];
}

export interface SalesSession {
  id: string;
  business_date: string;
  opened_at: string;
  closed_at: string | null;
  opened_by: string;
  closed_by: string | null;
  closing_snapshot: ClosingSnapshot | null;
}

export const formatSalesTimestamp = (value: string): string =>
  new Date(value).toLocaleString('en-GB', {
    timeZone: SALES_TIME_ZONE, day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

export const sriLankaDate = (value: string): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SALES_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find(part => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

/** Suggested opening only. Nothing opens or closes automatically. */
export const suggestedOpeningTime = (): string => {
  const now = new Date();
  let date = sriLankaDate(now.toISOString());
  if (now.getTime() < new Date(`${date}T16:00:00+05:30`).getTime()) {
    date = sriLankaDate(new Date(now.getTime() - 86400000).toISOString());
  }
  return `${date}T16:00`;
};

export const openingTimeToISO = (localValue: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localValue)) {
    throw new Error('Choose a valid opening date and time.');
  }
  const parsed = new Date(`${localValue}:00+05:30`);
  if (!Number.isFinite(parsed.getTime())) throw new Error('Invalid opening time.');
  return parsed.toISOString();
};

function failure(error: { message: string; code?: string }): Error {
  if (error.code === '42P01' || error.code === 'PGRST202') {
    return new Error('Sales-day setup is unavailable. Check that sales_sessions.sql ran successfully.');
  }
  if (error.code === '55P03') {
    return new Error('Orders are still being processed. Finish billing, wait a moment, then try closing again.');
  }
  return new Error(error.message);
}

export async function getSalesSessions(): Promise<SalesSession[]> {
  const result: SalesSession[] = [];
  // Keyset pagination avoids the API row limit and offset shifts.
  let last: SalesSession | undefined;
  for (;;) {
    let query = supabase.from('sales_sessions').select('*')
      .order('opened_at', { ascending: false }).order('id', { ascending: false }).limit(200);
    if (last) query = query.or(`opened_at.lt.${last.opened_at},and(opened_at.eq.${last.opened_at},id.lt.${last.id})`);
    const { data, error } = await query;
    if (error) throw failure(error);
    const rows = (data || []) as SalesSession[];
    if (!rows.length) break;
    result.push(...rows);
    last = rows[rows.length - 1];
  }
  return result;
}

export async function openSalesDay(localOpening: string): Promise<SalesSession> {
  const { data, error } = await supabase.rpc('kanthaaram_open_sales_day', {
    p_opened_at: openingTimeToISO(localOpening),
  });
  if (error) throw failure(error);
  if (!data) throw new Error('The server did not return the opened sales day. Refresh before trying again.');
  return data as SalesSession;
}

export async function closeSalesDay(sessionId: string): Promise<SalesSession> {
  const { data, error } = await supabase.rpc('kanthaaram_close_sales_day', { p_session_id: sessionId });
  if (error) throw failure(error);
  if (!data) throw new Error('Closing result is unknown. Refresh before trying again.');
  return data as SalesSession;
}

interface ItemRow {
  id: string; product_id: string | null; product_name: string;
  quantity: number; unit_price: number; notes: string | null;
}
interface OrderRow {
  id: string; order_number: string; customer_id: string | null;
  customer_name: string; customer_phone: string | null; cashier_name: string;
  subtotal: number; discount: number; tax: number; total: number;
  order_type: Order['type']; order_status: Order['status'];
  payment_method: Order['paymentMethod']; payment_status: Order['paymentStatus'];
  notes: string | null; qr_code_url: string | null; created_at: string;
  order_items: ItemRow[] | null;
}

const ORDER_SELECT = `id, order_number, customer_id, customer_name, customer_phone,
  cashier_name, subtotal, discount, tax, total, order_type, order_status,
  payment_method, payment_status, notes, qr_code_url, created_at,
  order_items(id, product_id, product_name, quantity, unit_price, notes)`;

function mapOrder(row: OrderRow, products: Product[]): Order {
  const timestamp = new Date(row.created_at);
  return {
    id: row.order_number, customerId: row.customer_id,
    customerName: row.customer_name, customerPhone: row.customer_phone || '',
    cashierName: row.cashier_name, type: row.order_type, status: row.order_status,
    paymentMethod: row.payment_method, paymentStatus: row.payment_status,
    subtotal: Number(row.subtotal), discount: Number(row.discount),
    tax: Number(row.tax), total: Number(row.total), createdAt: row.created_at,
    date: timestamp.toLocaleDateString('en-GB', { timeZone: SALES_TIME_ZONE, day: '2-digit', month: 'short', year: 'numeric' }),
    time: timestamp.toLocaleTimeString('en-GB', { timeZone: SALES_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: true }),
    notes: row.notes || undefined, qrCodeUrl: row.qr_code_url || undefined,
    items: (row.order_items || []).map(item => {
      const existing = products.find(product => product.id === item.product_id);
      const product: Product = existing ? { ...existing, name: item.product_name } : {
        id: item.product_id || `deleted-${item.id}`, name: item.product_name,
        category: 'Unavailable', price: Number(item.unit_price), purchasePrice: 0,
        stock: 0, lowStockAlert: 0, image: '', barcode: '', sku: '', tax: 0,
        unit: 'Item', status: 'Inactive', isStockItem: false,
      };
      return { itemId: item.id, productId: item.product_id, product,
        quantity: Number(item.quantity), price: Number(item.unit_price), notes: item.notes || undefined };
    }),
  };
}

/** Reads orders only; does not alter billing, AppContext or existing orderService. */
export async function getSalesOrders(
  products: Product[], openedAt?: string, closedAt?: string,
): Promise<Order[]> {
  const orders: Order[] = [];
  let last: OrderRow | undefined;
  for (;;) {
    let query = supabase.from('orders').select(ORDER_SELECT)
      .eq('is_deleted', false).eq('order_status', 'Completed')
      .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(200);
    if (openedAt) query = query.gte('created_at', openedAt);
    if (closedAt) query = query.lt('created_at', closedAt);
    if (last) query = query.or(`created_at.lt.${last.created_at},and(created_at.eq.${last.created_at},id.lt.${last.id})`);
    const { data, error } = await query;
    if (error) throw failure(error);
    const rows = (data || []) as unknown as OrderRow[];
    if (!rows.length) break;
    orders.push(...rows.map(row => mapOrder(row, products)));
    last = rows[rows.length - 1];
  }
  return orders;
}

/** SQL v1 stored financial fields only. Do not invent customer/receipt details. */
export function getClosingOrders(session: SalesSession): Order[] {
  if (!session.closed_at || !session.closing_snapshot || !Array.isArray(session.closing_snapshot.orders)) {
    throw new Error('The closing snapshot is missing. No live totals have been substituted.');
  }
  return session.closing_snapshot.orders.map(row => ({
    id: row.order_number, customerName: 'Not stored in closing snapshot', cashierName: '',
    items: [], subtotal: Number(row.subtotal), discount: Number(row.discount),
    tax: Number(row.tax), total: Number(row.total), type: row.order_type,
    status: 'Completed', paymentMethod: row.payment_method, paymentStatus: row.payment_status,
    createdAt: row.created_at,
    date: new Date(row.created_at).toLocaleDateString('en-GB', { timeZone: SALES_TIME_ZONE, day: '2-digit', month: 'short', year: 'numeric' }),
    time: new Date(row.created_at).toLocaleTimeString('en-GB', { timeZone: SALES_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: true }),
  }));
}
