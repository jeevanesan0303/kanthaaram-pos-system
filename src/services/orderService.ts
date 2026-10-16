import { supabase } from '../lib/supabase';
import { Order, Product } from '../types';
import {
  CreateOrderInput,
  UpdateOrderInput,
  OrderPaymentStatus,
  OrderStatus,
} from '../types';

type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number | string;
  notes: string | null;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  order_type: Order['type'];
  order_status: Order['status'];
  payment_method: Order['paymentMethod'];
  payment_status: Order['paymentStatus'];
  cashier_name: string;
  notes: string | null;
  qr_code_url: string | null;
  created_at: string;
  order_items: OrderItemRow[] | null;
};

const ORDER_SELECT = `
  id,
  order_number,
  customer_name,
  customer_phone,
  subtotal,
  discount,
  tax,
  total,
  order_type,
  order_status,
  payment_method,
  payment_status,
  cashier_name,
  notes,
  qr_code_url,
  created_at,
  order_items (
    id,
    product_id,
    product_name,
    quantity,
    unit_price,
    notes
  )
`;

const fallbackProduct = (item: OrderItemRow): Product => ({
  id: item.product_id ?? `deleted-${item.id}`,
  name: item.product_name,
  category: 'Unavailable',
  price: Number(item.unit_price),
  purchasePrice: 0,
  stock: 0,
  lowStockAlert: 0,
  image: '',
  barcode: '',
  sku: '',
  description: '',
  tax: 0,
  unit: 'Item',
  status: 'Inactive',
  isStockItem: false,
});

const mapOrder = (row: OrderRow, products: Product[]): Order => {
  const createdAt = new Date(row.created_at);

  return {
    id: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? '',

    items: (row.order_items ?? []).map(item => ({
      product:
        products.find(product => product.id === item.product_id) ??
        fallbackProduct(item),

      quantity: Number(item.quantity),
      price: Number(item.unit_price),
      notes: item.notes ?? undefined,
    })),

    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    tax: Number(row.tax),
    total: Number(row.total),

    type: row.order_type,
    status: row.order_status,

    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,

    time: createdAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),

    date: createdAt.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),

    createdAt: row.created_at,

    cashierName: row.cashier_name,

    notes: row.notes ?? undefined,

    qrCodeUrl:
      row.qr_code_url ??
      `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        row.order_number,
      )}`,
  };
};

/* =========================================================
   GET SINGLE ORDER
========================================================= */

const getOrderByDatabaseId = async (
  databaseId: string,
  products: Product[],
): Promise<Order> => {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', databaseId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapOrder(data as unknown as OrderRow, products);
};

/* =========================================================
   GET ALL ORDERS
========================================================= */

export const getOrders = async (
  products: Product[],
): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as OrderRow[]).map(row =>
    mapOrder(row, products),
  );
};

/* =========================================================
   CREATE ORDER
========================================================= */

export const createOrder = async (
  input: CreateOrderInput,
  products: Product[],
): Promise<Order> => {
  if (!input.items.length) {
    throw new Error('The cart is empty.');
  }

  const { data, error } = await supabase.rpc(
    'create_pos_order',
    {
      p_customer_id: input.customerId || null,

      p_customer_name:
        input.customerName?.trim() ||
        'Walk-in Customer',

      p_customer_phone:
        input.customerPhone?.trim() || null,

      p_order_type: input.orderType,

      p_payment_method: input.paymentMethod,

      p_payment_status:
        input.paymentStatus ?? 'Paid',

      p_discount:
        Number(input.discount) || 0,

      p_tax_percentage:
        Number(input.taxPercentage) || 0,

      p_notes:
        input.notes?.trim() || null,

      p_items: input.items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'The database did not return the new order ID.',
    );
  }

  const databaseId = String(data);

  /*
   * POS order payment completed immediately.
   * Therefore save new order as Completed.
   */

  const { error: statusError } = await supabase
    .from('orders')
    .update({
      order_status: 'Completed',

      payment_status:
        input.paymentStatus ?? 'Paid',
    })
    .eq('id', databaseId);

  if (statusError) {
    throw new Error(
      `Order was created, but status update failed: ${statusError.message}`,
    );
  }

  return getOrderByDatabaseId(
    databaseId,
    products,
  );
};

/* =========================================================
   UPDATE ORDER
========================================================= */

export const updateOrder = async (
  orderNumber: string,
  updates: UpdateOrderInput,
): Promise<void> => {
  const { data, error } = await supabase
    .from('orders')
    .update({
      customer_name:
        updates.customerName.trim() ||
        'Walk-in Customer',

      customer_phone:
        updates.customerPhone?.trim() ||
        null,

      order_type:
        updates.orderType,

      payment_method:
        updates.paymentMethod,

      payment_status:
        updates.paymentStatus,

      notes:
        updates.notes?.trim() ||
        null,
    })

    /*
     * Frontend Order.id contains
     * human readable order number.
     *
     * Example:
     * #KT00001
     *
     * Supabase orders.id is UUID.
     */

    .eq(
      'order_number',
      orderNumber,
    )

    .select(
      'id, order_number',
    )

    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      `Order ${orderNumber} was not found or you do not have permission to update it.`,
    );
  }
};

/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

export const updateOrderStatus = async (
  orderNumber: string,
  status: OrderStatus,
): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({
      order_status: status,
    })
    .eq(
      'order_number',
      orderNumber,
    );

  if (error) {
    throw new Error(error.message);
  }
};

/* =========================================================
   UPDATE PAYMENT STATUS
========================================================= */

export const updateOrderPaymentStatus = async (
  orderNumber: string,
  status: OrderPaymentStatus,
): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: status,
    })
    .eq(
      'order_number',
      orderNumber,
    );

  if (error) {
    throw new Error(error.message);
  }
};

/* =========================================================
   DEACTIVATE ORDER
   ---------------------------------------------------------
   IMPORTANT:
   Order is NOT permanently deleted.

   We only change:
   Completed -> Cancelled

   Therefore order remains inside database.
========================================================= */

export const deactivateOrder = async (
  orderNumber: string,
): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({
      order_status: 'Cancelled',
    })
    .eq(
      'order_number',
      orderNumber,
    );

  if (error) {
    throw new Error(error.message);
  }
};

/* =========================================================
   RESTORE DEACTIVATED ORDER
   ---------------------------------------------------------
   Cancelled -> Completed

   Order will appear again inside normal Orders page.
========================================================= */

export const restoreOrder = async (
  orderNumber: string,
): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({
      order_status: 'Completed',
    })
    .eq(
      'order_number',
      orderNumber,
    );

  if (error) {
    throw new Error(error.message);
  }
};

/* =========================================================
   PERMANENT DELETE
   ---------------------------------------------------------
   This function MUST only be used from
   Deactivated Orders page.

   Once executed, order is permanently removed
   from Supabase database.
========================================================= */

export const permanentlyDeleteOrder = async (
  orderNumber: string,
): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq(
      'order_number',
      orderNumber,
    );

  if (error) {
    throw new Error(error.message);
  }
};