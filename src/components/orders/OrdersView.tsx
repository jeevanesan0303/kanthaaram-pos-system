import React from 'react';
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  Loader2,
  Pencil,
  Printer,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  WalletCards,
  X,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useApp } from '../../context/AppContext';
import { Order, OrderType, PaymentMethod, OrderPaymentStatus, UpdateOrderInput } from '../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
type TypeFilter = 'All' | OrderType;
type PaymentMethodFilter = 'All' | PaymentMethod;

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'QR',
  'Card',
  'Bank Transfer',
  'Split Payment',
  'Credit Customer',
  'Gift Card',
];

const PAGE_SIZE = 10;

const csvCell = (value: unknown): string =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

export const OrdersView: React.FC = () => {
  const {
    orders,
    ordersLoading,
    refreshOrders,
    deactivateOrder,
    updateOrder,
    setActiveReceiptOrder,
    settings,
    currentUser,
  } = useApp();

  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState<PaymentMethodFilter>('All');
  const [search, setSearch] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [editingOrder, setEditingOrder] = React.useState<Order | null>(null);
  const [editForm, setEditForm] = React.useState<UpdateOrderInput>({
    customerName: '',
    customerPhone: '',
    orderType: 'Takeaway',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    notes: '',
  });
  const [savingEdit, setSavingEdit] = React.useState(false);

  const currency = settings.currency || 'LKR';

  const formatMoney = (amount: number): string =>
    `${currency} ${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDatePickerDate = (value: string): string => {
    if (!value) return '';
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Orders page is a completed-sales history. Non-completed orders are not shown here.
  const completedOrders = React.useMemo(
    () => orders.filter(order => order.status === 'Completed'),
    [orders],
  );

  const filteredOrders = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const selectedDate = formatDatePickerDate(dateFilter);

    return completedOrders.filter(order => {
      const matchesType = typeFilter === 'All' || order.type === typeFilter;
      const matchesPaymentMethod =
        paymentMethodFilter === 'All' || order.paymentMethod === paymentMethodFilter;
      const matchesDate = !selectedDate || order.date === selectedDate;
      const matchesSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.cashierName.toLowerCase().includes(term) ||
        order.paymentMethod.toLowerCase().includes(term);

      return matchesType && matchesPaymentMethod && matchesDate && matchesSearch;
    });
  }, [completedOrders, typeFilter, paymentMethodFilter, dateFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, paymentMethodFilter, dateFilter, search]);

  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredOrders.slice(start, start + PAGE_SIZE);
  }, [filteredOrders, currentPage]);

  const summary = React.useMemo(() => ({
    totalOrders: completedOrders.length,
    paidRevenue: completedOrders
      .filter(order => order.paymentStatus === 'Paid')
      .reduce((sum, order) => sum + Number(order.total), 0),
    pendingPayments: completedOrders.filter(order => order.paymentStatus === 'Pending').length,
    paidOrders: completedOrders.filter(order => order.paymentStatus === 'Paid').length,
  }), [completedOrders]);

  const handleRefresh = async (): Promise<void> => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      await refreshOrders();
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Refresh failed',
        text: error instanceof Error ? error.message : 'Unable to refresh orders.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const openEditOrder = (order: Order): void => {
    setEditingOrder(order);
    setEditForm({
      customerName: order.customerName || 'Walk-in Customer',
      customerPhone: order.customerPhone || '',
      orderType: order.type,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      notes: order.notes || '',
    });
  };

  const closeEditOrder = (): void => {
    if (savingEdit) return;
    setEditingOrder(null);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editingOrder || savingEdit) return;
    if (!editForm.customerName.trim()) {
      await Swal.fire({ icon: 'warning', title: 'Customer name required', text: 'Please enter a customer name or use Walk-in Customer.', confirmButtonColor: '#f59e0b' });
      return;
    }

    try {
      setSavingEdit(true);
      await updateOrder(editingOrder.id, {
        ...editForm,
        customerName: editForm.customerName.trim(),
        customerPhone: editForm.customerPhone?.trim() || '',
        notes: editForm.notes?.trim() || '',
      });
      const orderId = editingOrder.id;
      setEditingOrder(null);
      await Swal.fire({ icon: 'success', title: 'Order updated', text: `${orderId} has been updated successfully.`, timer: 1500, showConfirmButton: false });
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Update failed', text: error instanceof Error ? error.message : 'Unable to update the order.', confirmButtonColor: '#f59e0b' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeactivate = async (order: Order): Promise<void> => {
    if (processingId || currentUser?.role !== 'Admin') return;

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Deactivate order?',
      html: `This will move <b>${order.id}</b> to Deactivated Orders.<br/>You can restore it later or permanently delete it there.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, deactivate',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      width: 520,
      customClass: {
        popup: 'rounded-3xl',
        confirmButton: 'px-5 py-3 rounded-xl font-bold',
        cancelButton: 'px-5 py-3 rounded-xl font-bold',
      },
    });

    if (!result.isConfirmed) return;

    try {
      setProcessingId(order.id);

      Swal.fire({
        title: 'Deactivating...',
        text: `Moving ${order.id} to Deactivated Orders`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });

      await deactivateOrder(order.id);

      await Swal.fire({
        icon: 'success',
        title: 'Deactivated!',
        text: `Order ${order.id} was moved to Deactivated Orders.`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Deactivate failed',
        text: error instanceof Error ? error.message : 'Unable to deactivate the order.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportCSV = (): void => {
    const header = [
      'Order Number', 'Customer', 'Phone', 'Date', 'Time', 'Type',
      'Payment Method', 'Payment Status', 'Subtotal', 'Discount', 'Tax', 'Total', 'Cashier',
    ].map(csvCell).join(',');

    const rows = filteredOrders.map(order => [
      order.id,
      order.customerName,
      order.customerPhone ?? '',
      order.date,
      order.time,
      order.type,
      order.paymentMethod,
      order.paymentStatus,
      order.subtotal,
      order.discount,
      order.tax,
      order.total,
      order.cashierName,
    ].map(csvCell).join(','));

    const blob = new Blob([[header, ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  // Export filtered completed orders to PDF
const handleExportPDF = (): void => {
  if (!filteredOrders.length) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const reportDate = new Date().toLocaleDateString('en-GB');

  // Report heading
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');

  doc.text('Kanthaaram - Orders Report', 14, 18);

  // Report information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Generated Date: ${reportDate}`, 14, 26);
  doc.text(
    `Total Orders: ${filteredOrders.length}`,
    14,
    32,
  );

  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0,
  );

  doc.text(
    `Total Sales: ${currency} ${totalRevenue.toLocaleString(
      'en-US',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    )}`,
    14,
    38,
  );

  // Table columns
  const tableHeaders = [
    'Order Number',
    'Customer',
    'Phone',
    'Date',
    'Time',
    'Type',
    'Payment Method',
    'Payment Status',
    'Subtotal',
    'Discount',
    'Tax',
    'Total',
    'Cashier',
  ];

  // Table data
  const tableRows = filteredOrders.map((order) => [
    order.id,
    order.customerName || 'Walk-in Customer',
    order.customerPhone || '-',
    order.date,
    order.time,
    order.type,
    order.paymentMethod,
    order.paymentStatus,
    Number(order.subtotal || 0).toFixed(2),
    Number(order.discount || 0).toFixed(2),
    Number(order.tax || 0).toFixed(2),
    Number(order.total || 0).toFixed(2),
    order.cashierName || '-',
  ]);

  // Generate PDF table
  autoTable(doc, {
    startY: 44,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',

    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
    },

    headStyles: {
      fillColor: [4, 36, 24],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },

    alternateRowStyles: {
      fillColor: [250, 247, 242],
    },

    margin: {
      left: 10,
      right: 10,
    },
  });

  // Save PDF
  doc.save(
    `kanthaaram-orders-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`,
  );
};
// Export filtered completed orders to Excel
const handleExportExcel = (): void => {
  if (!filteredOrders.length) return;

  // Prepare order data
  const excelData = filteredOrders.map((order) => ({
    'Order Number': order.id,
    Customer: order.customerName || 'Walk-in Customer',
    Phone: order.customerPhone || '',
    Date: order.date,
    Time: order.time,
    Type: order.type,
    'Payment Method': order.paymentMethod,
    'Payment Status': order.paymentStatus,
    Subtotal: Number(order.subtotal || 0),
    Discount: Number(order.discount || 0),
    Tax: Number(order.tax || 0),
    Total: Number(order.total || 0),
    Cashier: order.cashierName || '',
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 18 }, // Order Number
    { wch: 24 }, // Customer
    { wch: 16 }, // Phone
    { wch: 16 }, // Date
    { wch: 14 }, // Time
    { wch: 14 }, // Type
    { wch: 20 }, // Payment Method
    { wch: 16 }, // Payment Status
    { wch: 14 }, // Subtotal
    { wch: 14 }, // Discount
    { wch: 12 }, // Tax
    { wch: 14 }, // Total
    { wch: 20 }, // Cashier
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Completed Orders',
  );

  // Save Excel file
  XLSX.writeFile(
    workbook,
    `kanthaaram-orders-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`,
  );
};

  const cards = [
    { label: 'Completed Orders', value: summary.totalOrders.toLocaleString(), icon: ShoppingBag, style: 'bg-blue-100 text-blue-700' },
    { label: 'Paid Revenue', value: formatMoney(summary.paidRevenue), icon: Banknote, style: 'bg-emerald-100 text-emerald-700' },
    { label: 'Pending Payments', value: summary.pendingPayments.toLocaleString(), icon: WalletCards, style: 'bg-amber-100 text-amber-700' },
    { label: 'Paid Orders', value: summary.paidOrders.toLocaleString(), icon: ClipboardList, style: 'bg-violet-100 text-violet-700' },
  ];

  const startRow = filteredOrders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(currentPage * PAGE_SIZE, filteredOrders.length);

  return (
    <div className="min-h-screen space-y-6 bg-[#FAF7F2] p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-xl font-black text-gray-900">
            <ClipboardList className="h-6 w-6 text-amber-600" /> Orders Management
          </h1>
          <p className="mt-1 text-xs text-gray-500">Completed POS orders and their actual payment methods</p>
        </div>
       <div className="flex flex-wrap items-center gap-2">

  {/* Refresh Button */}
  <button
    type="button"
    onClick={() => void handleRefresh()}
    disabled={refreshing || ordersLoading}
    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
  >
    <RefreshCw
      className={`h-4 w-4 text-emerald-600 ${
        refreshing ? 'animate-spin' : ''
      }`}
    />
    Refresh
  </button>

  {/* Export CSV */}
  <button
    type="button"
    onClick={handleExportCSV}
    disabled={!filteredOrders.length}
    title="Export orders to CSV"
    className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Download className="h-4 w-4 text-amber-400" />
    Export CSV
  </button>

  {/* Export PDF */}
  <button
    type="button"
    onClick={handleExportPDF}
    disabled={!filteredOrders.length}
    title="Export orders to PDF"
    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <FileText className="h-4 w-4" />
    Export PDF
  </button>

  {/* Export Excel */}
  <button
    type="button"
    onClick={handleExportExcel}
    disabled={!filteredOrders.length}
    title="Export orders to Excel"
    className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <FileSpreadsheet className="h-4 w-4" />
    Export Excel
  </button>

</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.style}`}><Icon className="h-5 w-5" /></div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
              <p className="mt-1 font-mono text-xl font-black text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs">
            {(['All', 'Dine In', 'Takeaway'] as const).map(type => (
              <button key={type} type="button" onClick={() => setTypeFilter(type)} className={`flex-1 rounded-lg px-3 py-2 font-bold ${typeFilter === type ? 'bg-amber-400 text-amber-950 shadow-sm' : 'text-gray-500'}`}>{type}</button>
            ))}
          </div>

          <select value={paymentMethodFilter} onChange={event => setPaymentMethodFilter(event.target.value as PaymentMethodFilter)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold outline-none">
            <option value="All">All payment methods</option>
            {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
          </select>

          <input type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none" />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Order, customer, cashier, payment..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs outline-none" />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-220 text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Date & Time</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Payment Method</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedOrders.map(order => {
                const busy = processingId === order.id;
                return (
                  <tr key={order.id} className="transition hover:bg-amber-50/40">
                    <td className="px-3 py-3 font-mono font-black text-gray-900">{order.id}</td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-gray-800">{order.customerName || 'Walk-in Customer'}</p>
                      <p className="text-[10px] text-gray-400">{order.customerPhone || 'No phone'}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-500">{order.date}<br /><span className="text-[10px]">{order.time}</span></td>
                    <td className="px-3 py-3 font-semibold text-gray-700">{order.type}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10px] font-black text-gray-800">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono font-black text-amber-700">{formatMoney(order.total)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin text-amber-600" />}
                        <button type="button" onClick={() => setActiveReceiptOrder(order)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-amber-600" title="View receipt"><Eye className="h-4 w-4" /></button>
                        <button type="button" onClick={() => setActiveReceiptOrder(order)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-amber-600" title="Print receipt"><Printer className="h-4 w-4" /></button>
                        {currentUser?.role === 'Admin' && <button type="button" disabled={busy} onClick={() => openEditOrder(order)} className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50" title="Edit order"><Pencil className="h-4 w-4" /></button>}
                        {currentUser?.role === 'Admin' && <button type="button" disabled={busy} onClick={() => void handleDeactivate(order)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Deactivate order"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(ordersLoading || refreshing) && <div className="flex items-center justify-center gap-2 py-12 text-xs font-bold text-gray-500"><Loader2 className="h-5 w-5 animate-spin text-amber-600" /> Loading orders...</div>}
        {!ordersLoading && !refreshing && !filteredOrders.length && <div className="py-14 text-center"><ClipboardList className="mx-auto h-10 w-10 text-gray-200" /><p className="mt-3 text-sm font-black text-gray-700">No completed orders found</p><p className="mt-1 text-xs text-gray-400">Try changing the filters or complete a new POS payment.</p></div>}

        {!ordersLoading && !refreshing && filteredOrders.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[11px] font-semibold text-gray-500">
              Showing <span className="font-black text-gray-800">{startRow}-{endRow}</span> of <span className="font-black text-gray-800">{filteredOrders.length}</span> orders · 10 per page
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1} className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <span className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-800">
                Page {currentPage} / {totalPages}
              </span>

              <button type="button" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button type="button" onClick={() => { setSearch(''); setDateFilter(''); setTypeFilter('All'); setPaymentMethodFilter('All'); setCurrentPage(1); }} className="text-[11px] font-bold text-amber-700 hover:underline">Clear filters</button>
          </div>
        )}
      </div>


      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Edit completed order</p>
                <h2 className="mt-1 font-serif text-xl font-black text-gray-900">{editingOrder.id}</h2>
              </div>
              <button type="button" onClick={closeEditOrder} disabled={savingEdit} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50" title="Close"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Customer name</span>
                <input value={editForm.customerName} onChange={event => setEditForm((previous: UpdateOrderInput) => ({ ...previous, customerName: event.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-400 focus:bg-white" />
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Customer phone</span>
                <input value={editForm.customerPhone || ''} onChange={event => setEditForm((previous: UpdateOrderInput) => ({ ...previous, customerPhone: event.target.value }))} placeholder="Optional" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-400 focus:bg-white" />
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Order type</span>
                <select value={editForm.orderType} onChange={event => setEditForm((previous: UpdateOrderInput) => ({ ...previous, orderType: event.target.value as OrderType }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-400">
                  <option value="Takeaway">Takeaway</option><option value="Dine In">Dine In</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Payment method</span>
                <select value={editForm.paymentMethod} onChange={event => setEditForm((previous: UpdateOrderInput) => ({ ...previous, paymentMethod: event.target.value as PaymentMethod }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-400">
                  {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Payment status</span>
                <select value={editForm.paymentStatus} onChange={event => setEditForm((previous: UpdateOrderInput) => ({ ...previous, paymentStatus: event.target.value as OrderPaymentStatus }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-amber-400">
                  <option value="Paid">Paid</option><option value="Pending">Pending</option><option value="Refunded">Refunded</option>
                </select>
              </label>
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Order total</p>
                <p className="mt-1 font-mono text-lg font-black text-gray-900">{formatMoney(editingOrder.total)}</p>
                <p className="mt-1 text-[10px] leading-4 text-gray-500">Items, quantity, price and stock stay unchanged so completed-sale inventory remains accurate.</p>
              </div>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Notes</span>
                <textarea value={editForm.notes || ''} onChange={event => setEditForm((previous: UpdateOrderInput) => ({ ...previous, notes: event.target.value }))} rows={3} placeholder="Optional order note" className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:bg-white" />
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button type="button" onClick={closeEditOrder} disabled={savingEdit} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-100 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void handleSaveEdit()} disabled={savingEdit} className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-amber-950 shadow-sm hover:bg-amber-500 disabled:opacity-60">
                {savingEdit && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};