import React from 'react';
import {
  ArchiveX,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';

const PAGE_SIZE = 10;

export const DeactivatedOrdersView: React.FC = () => {
  const {
    orders,
    ordersLoading,
    refreshOrders,
    restoreOrder,
    permanentlyDeleteOrder,
    settings,
    currentUser,
  } = useApp();

  const [search, setSearch] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

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

  const deactivatedOrders = React.useMemo(
    () => orders.filter(order => order.status === 'Cancelled'),
    [orders],
  );

  const filteredOrders = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const selectedDate = formatDatePickerDate(dateFilter);
    return deactivatedOrders.filter(order => {
      const matchesSearch = !term ||
        order.id.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        (order.customerPhone || '').toLowerCase().includes(term) ||
        order.paymentMethod.toLowerCase().includes(term);
      const matchesDate = !selectedDate || order.date === selectedDate;
      return matchesSearch && matchesDate;
    });
  }, [deactivatedOrders, search, dateFilter]);

  React.useEffect(() => setCurrentPage(1), [search, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleRefresh = async (): Promise<void> => {
    try {
      setRefreshing(true);
      await refreshOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRestore = async (order: Order): Promise<void> => {
    if (processingId || currentUser?.role !== 'Admin') return;
    const result = await Swal.fire({
      icon: 'question',
      title: 'Restore order?',
      html: `Restore <b>${order.id}</b> to the active Orders section?`,
      showCancelButton: true,
      confirmButtonText: 'Restore',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#6b7280',
      customClass: { popup: 'rounded-3xl' },
    });
    if (!result.isConfirmed) return;

    try {
      setProcessingId(order.id);
      await restoreOrder(order.id);
      await Swal.fire({
        icon: 'success',
        title: 'Restored!',
        text: `${order.id} is active again in Orders.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Restore failed',
        text: error instanceof Error ? error.message : 'Unable to restore the order.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handlePermanentDelete = async (order: Order): Promise<void> => {
    if (processingId || currentUser?.role !== 'Admin') return;
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Permanently delete order?',
      html: `<b>${order.id}</b> will be permanently removed from the database.<br/><span style="color:#dc2626;font-weight:700">This cannot be undone.</span>`,
      showCancelButton: true,
      confirmButtonText: 'Permanently Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      customClass: { popup: 'rounded-3xl' },
    });
    if (!result.isConfirmed) return;

    try {
      setProcessingId(order.id);
      await permanentlyDeleteOrder(order.id);
      await Swal.fire({
        icon: 'success',
        title: 'Permanently deleted',
        text: `${order.id} has been removed permanently.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Permanent delete failed',
        text: error instanceof Error ? error.message : 'Unable to permanently delete the order.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const startRow = filteredOrders.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endRow = Math.min(currentPage * PAGE_SIZE, filteredOrders.length);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ArchiveX className="h-6 w-6 text-red-600" />
            <h1 className="font-serif text-2xl font-black text-gray-900">Deactivated Orders</h1>
          </div>
          <p className="mt-1 text-xs font-semibold text-gray-500">
            Deactivated orders remain saved here until restored or permanently deleted.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing || ordersLoading}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 text-emerald-600 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
        <p className="text-xs font-black text-red-800">Status: Deactivated</p>
        <p className="mt-1 text-[11px] leading-5 text-red-700">
          Deactivating an order does not return stock or change completed-sale quantities. Restore returns the same saved order to Orders. Permanent Delete removes the database record.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_190px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search order, customer, phone or payment..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-xs font-semibold outline-none focus:border-red-300 focus:bg-white"
            />
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={event => setDateFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-red-300 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => { setSearch(''); setDateFilter(''); setCurrentPage(1); }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-wide text-gray-400">
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Date / Time</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageOrders.map(order => {
                const busy = processingId === order.id;
                return (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
                    <td className="px-3 py-3 font-mono font-black text-gray-900">{order.id}</td>
                    <td className="px-3 py-3">
                      <p className="font-black text-gray-800">{order.customerName}</p>
                      <p className="mt-0.5 text-[10px] text-gray-400">{order.customerPhone || 'No phone'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-gray-700">{order.date}</p>
                      <p className="mt-0.5 text-[10px] text-gray-400">{order.time}</p>
                    </td>
                    <td className="px-3 py-3 font-bold text-gray-700">{order.type}</td>
                    <td className="px-3 py-3 font-bold text-gray-700">{order.paymentMethod}</td>
                    <td className="px-3 py-3 font-mono font-black text-gray-900">{formatMoney(order.total)}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-black text-red-700 ring-1 ring-red-100">
                        Deactivated
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {busy && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                        {currentUser?.role === 'Admin' && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleRestore(order)}
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                              title="Restore order"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handlePermanentDelete(order)}
                              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black text-white hover:bg-red-700 disabled:opacity-50"
                              title="Permanently delete order"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Permanent Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(ordersLoading || refreshing) && (
          <div className="flex items-center justify-center gap-2 py-12 text-xs font-bold text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-red-600" /> Loading deactivated orders...
          </div>
        )}

        {!ordersLoading && !refreshing && !filteredOrders.length && (
          <div className="py-14 text-center">
            <ArchiveX className="mx-auto h-10 w-10 text-gray-200" />
            <p className="mt-3 text-sm font-black text-gray-700">No deactivated orders</p>
            <p className="mt-1 text-xs text-gray-400">Orders deactivated from the Orders page will appear here.</p>
          </div>
        )}

        {!ordersLoading && !refreshing && filteredOrders.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[11px] font-semibold text-gray-500">
              Showing <span className="font-black text-gray-800">{startRow}-{endRow}</span> of <span className="font-black text-gray-800">{filteredOrders.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] font-bold text-gray-600 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-black text-red-700">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] font-bold text-gray-600 disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
