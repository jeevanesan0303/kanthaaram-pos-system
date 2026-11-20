import type { Order, OrderEditLine, UpdateOrderInput } from '../types';

export const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
export const orderEditTotals = (items: OrderEditLine[], discount: number, original: Order) => {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + roundMoney(item.quantity * item.price), 0));
  const oldBase = original.subtotal;
  const rate = oldBase > 0 ? original.tax / oldBase : 0;
  const tax = roundMoney(subtotal * rate);
  return { subtotal, tax, total: roundMoney(subtotal - discount + tax), rate };
};

// Compare the exact saved sale, including historical product names and item IDs.
export const orderEditSnapshot = (order: Order) => ({
  header: {
    customer_id: order.customerId || null,
    customer_name: order.customerName, customer_phone: order.customerPhone || null,
    order_type: order.type, order_status: order.status,
    payment_method: order.paymentMethod, payment_status: order.paymentStatus,
    notes: order.notes || null, subtotal: order.subtotal,
    discount: order.discount, tax: order.tax, total: order.total,
  },
  items: order.items.map(item => ({
    id: item.itemId, product_id: item.productId ?? null,
    product_name: item.product.name, quantity: item.quantity,
    unit_price: item.price, notes: item.notes || null,
  })).sort((a, b) => (a.id || '').localeCompare(b.id || '')),
});

export const validateOrderEdit = (input: UpdateOrderInput): void => {
  if (!input.original || !input.requestId) throw new Error('Close and reopen this order before editing.');
  if (!input.customerName.trim()) throw new Error('Enter a customer name.');
  if (!input.items?.length) throw new Error('Keep at least one product in the order.');
  if (input.items.length > 200) throw new Error('An order can contain at most 200 lines.');
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000)
      throw new Error('Every quantity must be a whole number from 1 to 1,000.');
    if (!Number.isFinite(item.price) || item.price < 0 || item.price > 100000 || Math.abs(roundMoney(item.price) - item.price) > 0.000001)
      throw new Error('Enter a valid unit price with at most two decimal places.');
    if (!item.itemId && !item.productId) throw new Error('Select a product for every new line.');
  }
  const discount = input.discount;
  if (discount === undefined || !Number.isFinite(discount) || discount < 0 || Math.abs(roundMoney(discount) - discount) > 0.000001)
    throw new Error('Enter a valid discount with at most two decimal places.');
  const totals = orderEditTotals(input.items, discount, input.original);
  if (discount > totals.subtotal) throw new Error('Discount cannot exceed the subtotal.');
  if (input.original.subtotal <= 0 && input.original.tax !== 0)
    throw new Error('This historical tax amount needs review before editing items.');
};
