
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCcw,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { useApp } from '../../context/AppContext';

import {
  exportReportCSV,
  exportReportExcel,
  exportReportPDF,
  ReportColumn,
  ReportCell,
} from '../../utils/reportExport';

type ReportName =
  | 'Sales'
  | 'Product'
  | 'Inventory'
  | 'Customer'
  | 'Supplier'
  | 'Expense'
  | 'Employee';

type FilterType =
  | 'All'
  | 'Daily'
  | 'Monthly';

interface ReportDefinition {
  columns: ReportColumn[];
  rows: Record<string, ReportCell>[];
}

const reportTabs: ReportName[] = [
  'Sales',
  'Product',
  'Inventory',
  'Customer',
  'Supplier',
  'Expense',
  'Employee',
];

const getISODate = (
  value?: string,
): string => {
  if (!value) return '';

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  // Existing order format: 10 Aug 2026
  const match = value.match(
    /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/,
  );

  if (match) {
    const months: Record<string, string> = {
      Jan: '01',
      Feb: '02',
      Mar: '03',
      Apr: '04',
      May: '05',
      Jun: '06',
      Jul: '07',
      Aug: '08',
      Sep: '09',
      Oct: '10',
      Nov: '11',
      Dec: '12',
    };

    const [, day, month, year] = match;

    const monthNumber =
      months[month] ?? '';

    if (!monthNumber) return '';

    return `${year}-${monthNumber}-${day.padStart(
      2,
      '0',
    )}`;
  }

  const parsedDate = new Date(value);

  if (
    Number.isNaN(parsedDate.getTime())
  ) {
    return '';
  }

  return parsedDate
    .toISOString()
    .slice(0, 10);
};

const matchesPeriod = (
  value: string | undefined,
  filterType: FilterType,
  dailyFilter: string,
  monthlyFilter: string,
): boolean => {
  if (filterType === 'All') {
    return true;
  }

  const isoDate = getISODate(value);

  if (!isoDate) {
    return false;
  }

  if (filterType === 'Daily') {
    return (
      !dailyFilter ||
      isoDate === dailyFilter
    );
  }

  return (
    !monthlyFilter ||
    isoDate.startsWith(monthlyFilter)
  );
};

const formatMoney = (
  currency: string,
  amount: number,
): string =>
  `${currency} ${Number(
    amount || 0,
  ).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const ReportsView: React.FC =
  () => {
    const {
      orders,
      products,
      inventoryItems,
      customers,
      suppliers,
      expenses,
      employees,
      settings,
    } = useApp();

    const [
      activeReportTab,
      setActiveReportTab,
    ] = useState<ReportName>('Sales');

    const [filterType, setFilterType] =
      useState<FilterType>('All');

    const [dateFilter, setDateFilter] =
      useState('');

    const [monthFilter, setMonthFilter] =
      useState('');

    const [
      isExportMenuOpen,
      setIsExportMenuOpen,
    ] = useState(false);

    const [search, setSearch] =
      useState('');

    const [currentPage, setCurrentPage] =
      useState(1);

    const PAGE_SIZE = 10;

    const filteredOrders = useMemo(
      () =>
        orders.filter((order) =>
          matchesPeriod(
            order.date,
            filterType,
            dateFilter,
            monthFilter,
          ),
        ),
      [
        orders,
        filterType,
        dateFilter,
        monthFilter,
      ],
    );

    const filteredProducts = useMemo(
      () =>
        products.filter(
          (product) =>
            !product.isStockItem &&
            matchesPeriod(
              product.createdAt,
              filterType,
              dateFilter,
              monthFilter,
            ),
        ),
      [
        products,
        filterType,
        dateFilter,
        monthFilter,
      ],
    );

    const filteredInventory = useMemo(
      () =>
        inventoryItems.filter((item) =>
          matchesPeriod(
            item.createdAt,
            filterType,
            dateFilter,
            monthFilter,
          ),
        ),
      [
        inventoryItems,
        filterType,
        dateFilter,
        monthFilter,
      ],
    );

    const normalizeText = (
      value?: string,
    ): string =>
      (value || '').trim().toLowerCase();

    const filteredCustomers = useMemo(
      () => {
        if (filterType === 'All') {
          return customers;
        }

        const activeCustomerNames = new Set(
          filteredOrders.map((order) =>
            normalizeText(order.customerName),
          ),
        );

        return customers.filter((customer) =>
          activeCustomerNames.has(
            normalizeText(customer.name),
          ),
        );
      },
      [
        customers,
        filteredOrders,
        filterType,
      ],
    );

    const customerSalesStats = useMemo(() => {
      const stats = new Map<
        string,
        { orders: number; spent: number }
      >();

      filteredOrders.forEach((order) => {
        if (order.status !== 'Completed') return;

        const key = normalizeText(
          order.customerName,
        );

        if (!key) return;

        const current =
          stats.get(key) || {
            orders: 0,
            spent: 0,
          };

        current.orders += 1;

        if (order.paymentStatus === 'Paid') {
          current.spent += Number(
            order.total || 0,
          );
        }

        stats.set(key, current);
      });

      return stats;
    }, [filteredOrders]);

    const filteredSuppliers = useMemo(
      () =>
        suppliers.filter((supplier) =>
          matchesPeriod(
            supplier.createdAt,
            filterType,
            dateFilter,
            monthFilter,
          ),
        ),
      [
        suppliers,
        filterType,
        dateFilter,
        monthFilter,
      ],
    );

    const filteredExpenses = useMemo(
      () =>
        expenses.filter((expense) =>
          matchesPeriod(
            expense.date,
            filterType,
            dateFilter,
            monthFilter,
          ),
        ),
      [
        expenses,
        filterType,
        dateFilter,
        monthFilter,
      ],
    );

    const filteredEmployees = useMemo(
      () =>
        employees.filter((employee) =>
          matchesPeriod(
            employee.createdAt,
            filterType,
            dateFilter,
            monthFilter,
          ),
        ),
      [
        employees,
        filterType,
        dateFilter,
        monthFilter,
      ],
    );

    const reportDefinition =
      useMemo<ReportDefinition>(() => {
        switch (activeReportTab) {
          case 'Sales':
            return {
              columns: [
                {
                  key: 'orderId',
                  label: 'Order ID',
                },
                {
                  key: 'customer',
                  label: 'Customer',
                },
                {
                  key: 'type',
                  label: 'Order Type',
                },
                {
                  key: 'status',
                  label: 'Status',
                },
                {
                  key: 'paymentMethod',
                  label: 'Payment Method',
                },
                {
                  key: 'paymentStatus',
                  label: 'Payment Status',
                },
                {
                  key: 'date',
                  label: 'Date',
                },
                {
                  key: 'cashier',
                  label: 'Cashier',
                },
                {
                  key: 'total',
                  label: 'Total',
                },
              ],

              rows: filteredOrders.map(
                (order) => ({
                  orderId: order.id,
                  customer:
                    order.customerName,
                  type: order.type,
                  status: order.status,
                  paymentMethod:
                    order.paymentMethod,
                  paymentStatus:
                    order.paymentStatus,
                  date: order.date,
                  cashier:
                    order.cashierName,
                  total: formatMoney(
                    settings.currency,
                    order.total,
                  ),
                }),
              ),
            };

          case 'Product':
            return {
              columns: [
                {
                  key: 'name',
                  label: 'Product Name',
                },
                {
                  key: 'category',
                  label: 'Category',
                },
                {
                  key: 'sku',
                  label: 'SKU',
                },
                {
                  key: 'barcode',
                  label: 'Barcode',
                },
                {
                  key: 'unit',
                  label: 'Unit',
                },
                {
                  key: 'stock',
                  label: 'Stock',
                },
                {
                  key: 'price',
                  label: 'Selling Price',
                },
                {
                  key: 'status',
                  label: 'Status',
                },
              ],

              rows: filteredProducts.map(
                (product) => ({
                  name: product.name,
                  category:
                    product.category,
                  sku: product.sku || '—',
                  barcode:
                    product.barcode || '—',
                  unit: product.unit || '—',
                  stock: product.stock,
                  price: formatMoney(
                    settings.currency,
                    product.price,
                  ),
                  status: product.status,
                }),
              ),
            };

          case 'Inventory':
            return {
              columns: [
                {
                  key: 'name',
                  label: 'Item Name',
                },
                {
                  key: 'category',
                  label: 'Category',
                },
                {
                  key: 'sku',
                  label: 'SKU',
                },
                {
                  key: 'stock',
                  label: 'Current Stock',
                },
                {
                  key: 'alert',
                  label: 'Low Stock Alert',
                },
                {
                  key: 'unit',
                  label: 'Unit',
                },
                {
                  key: 'price',
                  label: 'Unit Price',
                },
                {
                  key: 'status',
                  label: 'Status',
                },
              ],

              rows: filteredInventory.map(
                (item) => ({
                  name: item.name,
                  category: item.category,
                  sku: item.sku || '—',
                  stock: item.stock,
                  alert:
                    item.lowStockAlert,
                  unit: item.unit,
                  price: formatMoney(
                    settings.currency,
                    item.price,
                  ),
                  status: item.status,
                }),
              ),
            };

          case 'Customer':
            return {
              columns: [
                {
                  key: 'name',
                  label: 'Customer Name',
                },
                {
                  key: 'mobile',
                  label: 'Mobile',
                },
                {
                  key: 'email',
                  label: 'Email',
                },
                {
                  key: 'address',
                  label: 'Address',
                },
                {
                  key: 'orders',
                  label: 'Total Orders',
                },
                {
                  key: 'spent',
                  label: 'Total Spent',
                },
                {
                  key: 'status',
                  label: 'Status',
                },
                {
                  key: 'created',
                  label: 'Created Date',
                },
              ],

              rows: filteredCustomers.map(
                (customer) => ({
                  name: customer.name,
                  mobile: customer.mobile,
                  email:
                    customer.email || '—',
                  address:
                    customer.address || '—',
                  orders:
                    customerSalesStats.get(
                      normalizeText(customer.name),
                    )?.orders || 0,
                  spent: formatMoney(
                    settings.currency,
                    customerSalesStats.get(
                      normalizeText(customer.name),
                    )?.spent || 0,
                  ),
                  status: customer.status,
                  created: getISODate(
                    customer.createdAt,
                  ),
                }),
              ),
            };

          case 'Supplier':
            return {
              columns: [
                {
                  key: 'company',
                  label: 'Company Name',
                },
                {
                  key: 'owner',
                  label: 'Owner',
                },
                {
                  key: 'phone',
                  label: 'Phone',
                },
                {
                  key: 'email',
                  label: 'Email',
                },
                {
                  key: 'products',
                  label: 'Products',
                },
                {
                  key: 'quantity',
                  label: 'Quantity Supplied',
                },
                {
                  key: 'price',
                  label: 'Buying Price',
                },
                {
                  key: 'payment',
                  label: 'Payment Type',
                },
              ],

              rows: filteredSuppliers.map(
                (supplier) => ({
                  company:
                    supplier.companyName,
                  owner: supplier.owner,
                  phone: supplier.phone,
                  email:
                    supplier.email || '—',
                  products:
                    supplier.products,
                  quantity:
                    supplier.quantitySupplied,
                  price: formatMoney(
                    settings.currency,
                    supplier.buyingPrice,
                  ),
                  payment:
                    supplier.paymentType,
                }),
              ),
            };

          case 'Expense':
            return {
              columns: [
                {
                  key: 'date',
                  label: 'Date',
                },
                {
                  key: 'category',
                  label: 'Category',
                },
                {
                  key: 'notes',
                  label: 'Notes',
                },
                {
                  key: 'addedBy',
                  label: 'Added By',
                },
                {
                  key: 'amount',
                  label: 'Amount',
                },
              ],

              rows: filteredExpenses.map(
                (expense) => ({
                  date: expense.date,
                  category:
                    expense.category,
                  notes:
                    expense.notes || '—',
                  addedBy:
                    expense.addedBy,
                  amount: formatMoney(
                    settings.currency,
                    expense.amount,
                  ),
                }),
              ),
            };

          case 'Employee':
            return {
              columns: [
                {
                  key: 'name',
                  label: 'Employee Name',
                },
                {
                  key: 'role',
                  label: 'Role',
                },
                {
                  key: 'userType',
                  label: 'User Type',
                },
                {
                  key: 'phone',
                  label: 'Phone',
                },
                {
                  key: 'email',
                  label: 'Email',
                },
                {
                  key: 'workingType',
                  label: 'Working Type',
                },
                {
                  key: 'salary',
                  label: 'Salary',
                },
                {
                  key: 'attendance',
                  label: 'Attendance',
                },
                {
                  key: 'status',
                  label: 'Status',
                },
              ],

              rows: filteredEmployees.map(
                (employee) => ({
                  name: employee.name,
                  role: employee.role,
                  userType:
                    employee.userType,
                  phone:
                    employee.phone || '—',
                  email:
                    employee.email || '—',
                  workingType:
                    employee.workingType ||
                    '—',
                  salary: formatMoney(
                    settings.currency,
                    employee.salary,
                  ),
                  attendance:
                    employee.attendance,
                  status: employee.status,
                }),
              ),
            };
        }
      }, [
        activeReportTab,
        filteredOrders,
        filteredProducts,
        filteredInventory,
        filteredCustomers,
        customerSalesStats,
        filteredSuppliers,
        filteredExpenses,
        filteredEmployees,
        settings.currency,
      ]);

    const searchedRows = useMemo(() => {
      const term = search
        .trim()
        .toLowerCase();

      if (!term) {
        return reportDefinition.rows;
      }

      return reportDefinition.rows.filter(
        (row) =>
          reportDefinition.columns.some(
            (column) =>
              String(
                row[column.key] ?? '',
              )
                .toLowerCase()
                .includes(term),
          ),
      );
    }, [
      reportDefinition,
      search,
    ]);

    const totalPages = Math.max(
      1,
      Math.ceil(
        searchedRows.length / PAGE_SIZE,
      ),
    );

    useEffect(() => {
      setCurrentPage(1);
    }, [
      activeReportTab,
      filterType,
      dateFilter,
      monthFilter,
      search,
    ]);

    useEffect(() => {
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }, [
      currentPage,
      totalPages,
    ]);

    const paginatedRows = useMemo(() => {
      const start =
        (currentPage - 1) * PAGE_SIZE;

      return searchedRows.slice(
        start,
        start + PAGE_SIZE,
      );
    }, [
      searchedRows,
      currentPage,
    ]);

    const startRow =
      searchedRows.length === 0
        ? 0
        : (currentPage - 1) *
            PAGE_SIZE +
          1;

    const endRow = Math.min(
      currentPage * PAGE_SIZE,
      searchedRows.length,
    );

    const totalSales = useMemo(
      () =>
        filteredOrders
          .filter(
            (order) =>
              order.status === 'Completed' &&
              order.paymentStatus === 'Paid',
          )
          .reduce(
            (total, order) =>
              total + Number(order.total || 0),
            0,
          ),
      [filteredOrders],
    );

    const totalExpenses = useMemo(
      () =>
        filteredExpenses.reduce(
          (total, expense) =>
            total + expense.amount,
          0,
        ),
      [filteredExpenses],
    );

    const periodLabel = useMemo(() => {
      if (filterType === 'Daily') {
        return dateFilter
          ? `Daily - ${dateFilter}`
          : 'Daily - Select a date';
      }

      if (filterType === 'Monthly') {
        return monthFilter
          ? `Monthly - ${monthFilter}`
          : 'Monthly - Select a month';
      }

      return 'All Time';
    }, [
      filterType,
      dateFilter,
      monthFilter,
    ]);

    const exportOptions = {
      reportName: activeReportTab,
      storeName:
        settings.storeName ||
        'Kaanthaaram Tea',
      period: periodLabel,
      columns:
        reportDefinition.columns,
      rows: searchedRows,
      currency: settings.currency,
    };

    const clearFilters = () => {
      setFilterType('All');
      setDateFilter('');
      setMonthFilter('');
      setSearch('');
      setCurrentPage(1);
    };

    return (
      <div className="min-h-screen space-y-6 bg-[#FAF7F2] p-6">
        <div className="flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h1 className="flex items-center gap-2 font-serif text-xl font-black text-gray-900">
              <BarChart3 className="h-6 w-6 text-amber-600" />
              Analytics & Business Reports
            </h1>

            <p className="text-xs text-gray-500">
              Generate Sales, Product,
              Inventory, Customer, Supplier,
              Expense and Employee reports
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-gray-200 bg-white p-1 text-[10px] font-bold">
              {(
                [
                  'All',
                  'Daily',
                  'Monthly',
                ] as FilterType[]
              ).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setFilterType(type)
                  }
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    filterType === type
                      ? 'bg-amber-400 text-amber-950 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type === 'All'
                    ? 'All Time'
                    : type}
                </button>
              ))}
            </div>

            {filterType === 'Daily' && (
              <input
                type="date"
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(
                    event.target.value,
                  )
                }
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            )}

            {filterType === 'Monthly' && (
              <input
                type="month"
                value={monthFilter}
                onChange={(event) =>
                  setMonthFilter(
                    event.target.value,
                  )
                }
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            )}

            {filterType !== 'All' && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Clear
              </button>
            )}

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search current report..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setIsExportMenuOpen(
                    (open) => !open,
                  )
                }
                disabled={
                  searchedRows
                    .length === 0
                }
                className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-amber-950 shadow-sm hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export Report
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      exportReportExcel(
                        exportOptions,
                      );

                      setIsExportMenuOpen(
                        false,
                      );
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Excel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportReportCSV(
                        exportOptions,
                      );

                      setIsExportMenuOpen(
                        false,
                      );
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <FileText className="h-4 w-4" />
                    Export CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportReportPDF(
                        exportOptions,
                      );

                      setIsExportMenuOpen(
                        false,
                      );
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-red-50 hover:text-red-700"
                  >
                    <FileText className="h-4 w-4" />
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profit calculation intentionally removed. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">
              Sales Revenue
            </p>

            <p className="mt-1 font-mono text-2xl font-black text-emerald-600">
              {formatMoney(
                settings.currency,
                totalSales,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">
              Recorded Expenses
            </p>

            <p className="mt-1 font-mono text-2xl font-black text-red-600">
              {formatMoney(
                settings.currency,
                totalExpenses,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">
              Current Report Records
            </p>

            <p className="mt-1 font-mono text-2xl font-black text-amber-700">
              {
                searchedRows
                  .length
              }
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex overflow-x-auto rounded-xl border border-gray-200/60 bg-gray-50 p-1 text-xs">
            {reportTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() =>
                  setActiveReportTab(tab)
                }
                className={`shrink-0 rounded-lg px-4 py-2 font-bold transition-all ${
                  activeReportTab === tab
                    ? 'bg-amber-400 text-amber-950 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab} Report
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <h2 className="font-serif text-base font-black text-gray-900">
                {activeReportTab} Report
              </h2>

              <p className="flex items-center gap-1 text-[11px] text-gray-400">
                <CalendarDays className="h-3.5 w-3.5" />
                {periodLabel}
              </p>
            </div>

            <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
              {
                searchedRows
                  .length
              }{' '}
              record(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold uppercase text-gray-400">
                  {reportDefinition.columns.map(
                    (column) => (
                      <th
                        key={column.key}
                        className="whitespace-nowrap px-3 py-3"
                      >
                        {column.label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50 font-medium">
                {paginatedRows.map(
                  (row, rowIndex) => (
                    <tr
                      key={`${activeReportTab}-${rowIndex}`}
                      className="hover:bg-amber-50/30"
                    >
                      {reportDefinition.columns.map(
                        (column) => (
                          <td
                            key={column.key}
                            className="max-w-72 whitespace-nowrap px-3 py-3 text-gray-600"
                          >
                            {String(
                              row[
                                column.key
                              ] ?? '—',
                            )}
                          </td>
                        ),
                      )}
                    </tr>
                  ),
                )}

                {searchedRows
                  .length === 0 && (
                  <tr>
                    <td
                      colSpan={
                        reportDefinition
                          .columns.length
                      }
                      className="py-14 text-center text-gray-400"
                    >
                      No {activeReportTab.toLowerCase()}{' '}
                      records found for the
                      selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {searchedRows.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-semibold text-gray-500">
                Showing{' '}
                <span className="font-black text-gray-800">
                  {startRow}-{endRow}
                </span>{' '}
                of{' '}
                <span className="font-black text-gray-800">
                  {searchedRows.length}
                </span>{' '}
                records · 10 per page
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1),
                    )
                  }
                  disabled={
                    currentPage === 1
                  }
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-800">
                  Page {currentPage} /{' '}
                  {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(
                        totalPages,
                        page + 1,
                      ),
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };