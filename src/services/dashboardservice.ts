import { supabase } from '../lib/supabase';
import {
  DashboardActiveOffer,
  DashboardData,
} from '../types';

type OfferRow = {
  id: string;
  name: string;
  type: 'Percentage' | 'Flat';
  discount: number | string;
  start_date: string;
  end_date: string;
  products: { name: string } | { name: string }[] | null;
};

const startOfLocalDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const addDays = (date: Date, amount: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const sumTotals = (rows: Array<{ total: number | string | null }> | null): number =>
  (rows ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0);

const productNameFromRelation = (products: OfferRow['products']): string | undefined => {
  if (!products) return undefined;
  return Array.isArray(products) ? products[0]?.name : products.name;
};

const mapActiveOffer = (row: OfferRow): DashboardActiveOffer => ({
  id: row.id,
  name: row.name,
  type: row.type,
  discount: Number(row.discount),
  productName: productNameFromRelation(row.products),
  startDate: row.start_date,
  endDate: row.end_date,
});

export const getDashboardData = async (): Promise<DashboardData> => {
  const todayStart = startOfLocalDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);
  const yesterdayStart = addDays(todayStart, -1);
  const todayDate = toLocalDateString(todayStart);

  const [
    todaySalesResult,
    yesterdaySalesResult,
    todayOrdersResult,
    newCustomersResult,
    activeOffersResult,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('total')
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', tomorrowStart.toISOString())
      .eq('payment_status', 'Paid')
      .neq('order_status', 'Cancelled'),

    supabase
      .from('orders')
      .select('total')
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', todayStart.toISOString())
      .eq('payment_status', 'Paid')
      .neq('order_status', 'Cancelled'),

    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', tomorrowStart.toISOString())
      .neq('order_status', 'Cancelled'),

    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', tomorrowStart.toISOString()),

    supabase
      .from('offers')
      .select(`
        id,
        name,
        type,
        discount,
        start_date,
        end_date,
        products (name)
      `)
      .eq('status', 'Active')
      .lte('start_date', todayDate)
      .gte('end_date', todayDate)
      .order('end_date', { ascending: true }),
  ]);

  const error =
    todaySalesResult.error ??
    yesterdaySalesResult.error ??
    todayOrdersResult.error ??
    newCustomersResult.error ??
    activeOffersResult.error;

  if (error) {
    console.error('Dashboard query failed:', error);
    throw new Error(error.message);
  }

  const todaySales = sumTotals(todaySalesResult.data);
  const yesterdaySales = sumTotals(yesterdaySalesResult.data);

  const salesChangePercentage =
    yesterdaySales === 0
      ? todaySales > 0
        ? 100
        : 0
      : ((todaySales - yesterdaySales) / yesterdaySales) * 100;

  return {
    metrics: {
      todaySales,
      yesterdaySales,
      salesChangePercentage: Math.round(salesChangePercentage * 10) / 10,
      todayOrderCount: todayOrdersResult.count ?? 0,
      newCustomerCount: newCustomersResult.count ?? 0,
      activeOfferCount: activeOffersResult.data?.length ?? 0,
    },
    activeOffers: ((activeOffersResult.data ?? []) as unknown as OfferRow[]).map(
      mapActiveOffer,
    ),
    generatedAt: new Date().toISOString(),
  };
};