import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Eye,
  Search,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDashboardData } from '../../services/dashboardservice';
import {
  DashboardData,
  Order,
} from '../../types';
export const DashboardView: React.FC = () => {
  const {
  orders,
  products,
  customers,
  categories,
  offers,
  suppliers,

  // Separate inventory backend
  inventoryItems,
  inventoryLoading,

  setActiveView,
  setActiveReceiptOrder,
  
  settings
} = useApp();

  const [orderTypeFilter, setOrderTypeFilter] = useState<'All' | 'Dine In' | 'Takeaway'>('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [timeframe, setTimeframe] = useState<'Today' | 'This Week' | 'This Month'>('This Week');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: string } | null>(null);
  const [dashboardData, setDashboardData] =
  useState<DashboardData | null>(null);

const [dashboardLoading, setDashboardLoading] =
  useState(true);

const [dashboardError, setDashboardError] =
  useState('');


  useEffect(() => {
  let mounted = true;

  const loadDashboard = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError('');

      const result = await getDashboardData();

      if (mounted) {
        setDashboardData(result);
      }
    } catch (error) {
      if (mounted) {
        setDashboardError(
          error instanceof Error
            ? error.message
            : 'Unable to load dashboard data.',
        );
      }
    } finally {
      if (mounted) {
        setDashboardLoading(false);
      }
    }
  };

  loadDashboard();

  return () => {
    mounted = false;
  };
}, [
  orders.length,
  customers.length,
  products.length,
  offers.length,
]);
  const currentChart = useMemo(() => {
  const now = new Date();

  let startDate: Date;
  let bucketCount: number;
  let labels: string[];
  let getBucketIndex: (date: Date) => number;

  if (timeframe === 'Today') {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    bucketCount = 6;

    labels = [
      '00:00',
      '04:00',
      '08:00',
      '12:00',
      '16:00',
      '20:00',
    ];

    getBucketIndex = date =>
      Math.min(5, Math.floor(date.getHours() / 4));
  } else if (timeframe === 'This Month') {
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    );

    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();

    bucketCount = Math.ceil(daysInMonth / 7);

    labels = Array.from(
      { length: bucketCount },
      (_, index) => `Week ${index + 1}`,
    );

    getBucketIndex = date =>
      Math.min(
        bucketCount - 1,
        Math.floor((date.getDate() - 1) / 7),
      );
  } else {
    startDate = new Date(now);
    const currentDay = startDate.getDay();
    const distanceFromMonday =
      currentDay === 0 ? 6 : currentDay - 1;

    startDate.setDate(
      startDate.getDate() - distanceFromMonday,
    );
    startDate.setHours(0, 0, 0, 0);

    bucketCount = 7;

    labels = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ];

    getBucketIndex = date => {
      const day = date.getDay();
      return day === 0 ? 6 : day - 1;
    };
  }

  const totals = Array<number>(
    bucketCount,
  ).fill(0);

  orders.forEach((order: Order) => {
    if (
      order.paymentStatus !== 'Paid' ||
      order.status === 'Cancelled' ||
      !order.createdAt
    ) {
      return;
    }

    const orderDate = new Date(order.createdAt);

    if (
      Number.isNaN(orderDate.getTime()) ||
      orderDate < startDate ||
      orderDate > now
    ) {
      return;
    }

    const index = getBucketIndex(orderDate);

    if (index >= 0 && index < totals.length) {
      totals[index] += Number(order.total || 0);
    }
  });

  const maximumValue = Math.max(...totals, 1);
  const graphMaximum =
    Math.ceil(maximumValue / 1000) * 1000 || 1000;

  const left = 20;
  const right = 470;
  const top = 10;
  const bottom = 130;

  const points = totals.map((total, index) => {
    const x =
      bucketCount === 1
        ? (left + right) / 2
        : left +
          (index * (right - left)) /
            (bucketCount - 1);

    const y =
      bottom -
      (total / graphMaximum) * (bottom - top);

    return {
      x,
      y,
      label: labels[index],
      value: `${settings.currency} ${total.toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )}`,
    };
  });

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`,
    )
    .join(' ');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${
          points[points.length - 1].x
        } ${bottom} L ${points[0].x} ${bottom} Z`
      : '';

  const compactCurrency = (value: number) => {
    if (value >= 1_000_000) {
      return `${settings.currency} ${(
        value / 1_000_000
      ).toFixed(1)}m`;
    }

    if (value >= 1000) {
      return `${settings.currency} ${(
        value / 1000
      ).toFixed(0)}k`;
    }

    return `${settings.currency} ${value.toFixed(0)}`;
  };

  return {
    yLabels: [
      compactCurrency(graphMaximum),
      compactCurrency(graphMaximum * 0.67),
      compactCurrency(graphMaximum * 0.33),
      compactCurrency(0),
    ],
    linePath,
    areaPath,
    points,
    xLabels: points.map(point => ({
      x: point.x,
      label: point.label,
    })),
  };
}, [orders, timeframe, settings.currency]);

  // const currentChart = getChartData();

    const lowStockInventoryItems =
  inventoryItems.filter(
    item =>
      item.status === 'Active' &&
      item.stock <= item.lowStockAlert
  );

  const filteredOrders = orders.filter(o => {
    const matchesType = orderTypeFilter === 'All' || o.type === orderTypeFilter;
    const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase()) || o.customerName.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Completed</span>;
      case 'Preparing': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Preparing</span>;
      case 'Ready': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Ready</span>;
      case 'On the way': return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">On the way</span>;
      default: return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

const metrics = dashboardData?.metrics;

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const salesChange =
  metrics?.salesChangePercentage ?? 0;


  const today = new Date().toISOString().slice(0, 10);

const activeOffers = offers.filter(
  offer =>
    offer.status?.trim().toLowerCase() === 'active',
);

  return (
    <div className="p-6 space-y-6 bg-[#FAF7F2] min-h-screen">
      {dashboardError && (
  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
    Dashboard error: {dashboardError}
  </div>
)}
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Sales */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-3xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold truncate">Today's Sales</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                {salesChange >= 0 ? '↑' : '↓'}{' '}
                {Math.abs(salesChange).toFixed(1)}%
              </span>
            </div>
            <p className="text-lg font-black text-gray-900 mt-1 font-mono leading-none">
              {dashboardLoading
                ? 'Loading...'
                : `${settings.currency} ${formatMoney(
                    metrics?.todaySales ?? 0,
                  )}`}
            </p>
            <p className="text-[10px] text-gray-400 mt-1.5 font-medium leading-none">vs yesterday</p>
          </div>
        </div>

        {/* Metric 2: Orders */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-3xs">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold truncate">Orders</span>
             <span className="text-[10px] font-bold text-gray-500">
  Today
</span>
            </div>
            <p className="text-lg font-black text-gray-900 mt-1 font-mono leading-none">
                        {dashboardLoading
            ? '...'
            : metrics?.todayOrderCount ?? 0}
            </p>
            <p className="text-[10px] text-gray-400 mt-1.5 font-medium leading-none">vs yesterday</p>
          </div>
        </div>

        {/* Metric 3: Customers */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-3xs">
            <Users className="w-6 h-6" />
          </div>
         <div className="flex-1 min-w-0">
  <div className="flex items-center justify-between">
    <span className="text-xs text-gray-500 font-semibold truncate">
      Customers
    </span>

    <span className="text-[10px] font-bold text-indigo-600">
      Live total
    </span>
  </div>

  <p className="text-lg font-black text-gray-900 mt-1 font-mono leading-none">
    {customers.length}
  </p>

  <p className="text-[10px] text-gray-400 mt-1.5 font-medium leading-none">
    +{metrics?.newCustomerCount ?? 0} new today
  </p>
</div>
           
          
        </div>

        {/* Metric 4: Total Products */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-3xs">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold truncate">Total Products</span>
              <span className="text-[10px] font-bold text-amber-600">
  Live total
</span>
            </div>
          <p className="text-lg font-black text-gray-900 mt-1 font-mono leading-none">
  {products.length}
</p>
           <p className="text-[10px] text-gray-400 mt-1.5 font-medium leading-none">
  {products.filter(product =>
    product.status === 'Active',
  ).length}{' '}
  active products
</p>
          </div>
        </div>
      </div>  

      {/* Sales Chart & Recent Orders Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm text-gray-900 font-serif">Sales Overview</h3>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="text-xs font-bold text-gray-750 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          {/* SVG Line Graph */}
          <div className="h-52 w-full relative pt-4 flex gap-3">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[9px] font-bold text-gray-400 h-32.5 text-right w-12 select-none pr-1.5 border-r border-gray-100">
              {currentChart.yLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
            
            <div className="flex-1 relative">
              {/* Tooltip Overlay */}
              {hoveredPoint && (
                <div 
                  className="absolute bg-gray-900/95 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow-lg pointer-events-none transition-all duration-150 -translate-x-1/2 -translate-y-full z-20 flex flex-col items-center border border-gray-800"
                  style={{ 
                    left: `${(hoveredPoint.x / 500) * 100}%`, 
                    top: `${(hoveredPoint.y / 170) * 100}%`,
                    marginTop: '-12px'
                  }}
                >
                  <span className="text-[8px] text-gray-400 uppercase tracking-wide">{hoveredPoint.label}</span>
                  <span className="font-mono text-emerald-400 mt-0.5">{hoveredPoint.value}</span>
                  <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 mt-1 -mb-2 border-r border-b border-gray-800"></div>
                </div>
              )}

              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 170">
                <defs>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Background Grid Lines */}
                <line x1="0" y1="10" x2="500" y2="10" stroke="#F3F4F6" strokeDasharray="4" />
                <line x1="0" y1="50" x2="500" y2="50" stroke="#F3F4F6" strokeDasharray="4" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="#F3F4F6" strokeDasharray="4" />
                <line x1="0" y1="130" x2="500" y2="130" stroke="#E5E7EB" strokeWidth="1" />

                {/* Area Fill */}
                <path
                  d={currentChart.areaPath}
                  fill="url(#emeraldGrad)"
                  className="transition-all duration-300"
                />
                {/* Smooth Line */}
                <path
                  d={currentChart.linePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
                {/* Data Points */}
                {currentChart.points.map((pt, i) => (
                  <g key={i}>
                    {/* Hover hotspot (larger invisible circle for easy mouse target) */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="14"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Visible circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPoint?.x === pt.x && hoveredPoint?.y === pt.y ? "7" : "5"}
                      fill={hoveredPoint?.x === pt.x && hoveredPoint?.y === pt.y ? "#059669" : "#FFFFFF"}
                      stroke="#059669"
                      strokeWidth="3"
                      className="pointer-events-none transition-all duration-150"
                    />
                  </g>
                ))}

                {/* X-axis Labels */}
                {currentChart.xLabels.map((xl, i) => (
                  <text
                    key={i}
                    x={xl.x}
                    y="155"
                    textAnchor="middle"
                    fill="#9CA3AF"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="sans-serif"
                  >
                    {xl.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts List */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-sm text-gray-900 font-serif">Low Stock Alerts</h3>
            <button 
              onClick={() => setActiveView('inventory')}
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              Manage Stock
            </button>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-56 pr-1">
           {inventoryLoading ? (
  <div className="py-8 text-center text-xs font-semibold text-gray-400">
    Loading inventory...
  </div>
) : lowStockInventoryItems.length > 0 ? (
  lowStockInventoryItems.map(item => (
                 <div
  key={item.id}
  onClick={() => setActiveView('inventory')}
  className="flex items-center justify-between p-2 rounded-xl hover:bg-amber-50/50 cursor-pointer transition-colors text-xs"
>
  <div className="flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />

    <div>
      <p className="font-bold text-gray-950">
        {item.name}
      </p>

      <p className="text-[10px] text-gray-400">
        Alert Threshold: {item.lowStockAlert}{' '}
        {item.unit}
      </p>
    </div>
  </div>

  <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
    {item.stock} {item.unit}
  </span>
</div>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-1.5 bg-emerald-50/30 rounded-2xl border border-dashed border-emerald-100 my-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600 animate-bounce" />
                <p className="text-xs font-bold text-emerald-950">All Stock Levels Normal</p>
                <p className="text-[10px] text-emerald-800">All items are above safety thresholds.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    

      {/* Grid of Management Modules matching bottom layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Product & Category Summaries */}
        <div className="space-y-6">
          {/* Product Management Summary */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-900">Product Management</h4>
              <button 
                onClick={() => setActiveView('products')}
                className="px-2.5 py-1 bg-amber-100 text-amber-950 hover:bg-amber-200 text-[10px] font-bold rounded-lg flex items-center gap-1"
              >
                 View Products
              </button>
            </div>
            <div className="divide-y divide-gray-50 text-xs">
              {products.slice(0, 4).map(p => (
                <div key={p.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={p.image} alt={p.name} className="w-7 h-7 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold text-gray-800">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.category}</p>
                    </div>
                  </div>
                  <span className="font-bold text-amber-700 font-mono">{settings.currency} {p.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Management Summary */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-900">Category Management</h4>
              <button 
                onClick={() => setActiveView('categories')}
                className="px-2.5 py-1 bg-amber-100 text-amber-955 hover:bg-amber-200 text-[10px] font-bold rounded-lg flex items-center gap-1"
              >
                View Categories
              </button>
            </div>
            <div className="divide-y divide-gray-50 text-xs">
              {categories.slice(0, 4).map(c => (
                <div key={c.id} className="py-2 flex items-center justify-between">
                  <span className="font-bold text-gray-800">{c.name}</span>
                  <span className="text-[10px] text-gray-500">{c.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Offers & Supplier Summaries */}
        <div className="space-y-6">
          {/* Offers Summary */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-900">Offers Management</h4>
              <button 
                onClick={() => setActiveView('offers')}
                className="px-2.5 py-1 bg-amber-100 text-amber-950 hover:bg-amber-200 text-[10px] font-bold rounded-lg flex items-center gap-1"
              >
                 View Offers
              </button>
            </div>
            <div className="divide-y divide-gray-50 text-xs">
              {activeOffers.slice(0, 3).map(o => (
                <div key={o.id} className="py-2 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{o.name}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">
  {o.type === 'Percentage'
    ? `${o.discount}% Discount`
    : `${settings.currency} ${o.discount.toFixed(
        2,
      )} Discount`}
</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">Active</span>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier Summary */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-900">Supplier Management</h4>
              <button 
                onClick={() => setActiveView('suppliers')}
                className="px-2.5 py-1 bg-amber-100 text-amber-950 hover:bg-amber-200 text-[10px] font-bold rounded-lg flex items-center gap-1"
              >
                 View Suppliers
              </button>
            </div>
            <div className="divide-y divide-gray-50 text-xs">
              {suppliers.slice(0, 3).map(s => (
                <div key={s.id} className="py-2 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{s.companyName}</p>
                    <p className="text-[10px] text-gray-400">{s.phone}</p>
                  </div>
                  <span className="text-gray-600 font-medium">{s.products}</span>
                </div>
              ))}
            </div>
          </div>

         {/* Low Stock Alerts Summary */}
<div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-3">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${
          lowStockInventoryItems.length > 0
            ? 'bg-red-600 animate-pulse'
            : 'bg-emerald-500'
        }`}
      />

      <h4 className="font-bold text-xs text-gray-900">
        Low Stock Alerts
      </h4>
    </div>

    <button
      type="button"
      onClick={() =>
        setActiveView('inventory')
      }
      className="px-2.5 py-1 bg-red-100 text-red-950 hover:bg-red-200 text-[10px] font-bold rounded-lg flex items-center gap-1"
    >
      Manage Stock
    </button>
  </div>

  <div className="divide-y divide-gray-50 text-xs">
    {inventoryLoading ? (
      <div className="py-6 text-center text-gray-400 font-medium">
        Loading inventory alerts...
      </div>
    ) : lowStockInventoryItems.length > 0 ? (
      lowStockInventoryItems.map(item => (
        <div
          key={item.id}
          onClick={() =>
            setActiveView('inventory')
          }
          className="py-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-red-50/50 rounded-xl px-2 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <p className="font-bold text-gray-800 truncate">
                {item.name}
              </p>

              <p className="text-[10px] text-red-600">
                {item.name} stock is below the alert
                quantity.
              </p>

              <p className="text-[10px] text-gray-400">
                Current:{' '}
                <span className="text-red-600 font-bold font-mono">
                  {item.stock} {item.unit}
                </span>

                {' / '}

                Alert:{' '}
                <span className="font-bold font-mono">
                  {item.lowStockAlert}{' '}
                  {item.unit}
                </span>
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full shrink-0">
            Low Stock
          </span>
        </div>
      ))
    ) : (
      <div className="py-6 text-center text-gray-400 font-medium">
        <CheckCircle className="w-7 h-7 text-emerald-500 mx-auto mb-2" />

        <p className="text-emerald-700 font-bold">
          All stock levels are safe
        </p>

        <p className="text-[10px] text-gray-400 mt-1">
          No item is below its alert quantity.
        </p>
      </div>
    )}
  </div>
</div>
        </div>
      </div>
    </div>
  );
};
