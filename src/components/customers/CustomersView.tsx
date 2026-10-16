import React from 'react';
import {
  Users, Search, Plus, Edit2, Trash2, Wallet,
  X, Check, UserCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';

const getTodayForDateInput = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const normalizeSriLankanMobile = (value: string): string | null => {
  const compactValue = value.trim().replace(/[\s()-]/g, '');

  if (/^07\d{8}$/.test(compactValue)) return compactValue;
  if (/^\+947\d{8}$/.test(compactValue)) {
    return `0${compactValue.slice(3)}`;
  }
  if (/^947\d{8}$/.test(compactValue)) {
    return `0${compactValue.slice(2)}`;
  }

  return null;
};

const sanitizeMobileInput = (value: string): string => {
  return value
    .replace(/[^\d+]/g, '')
    .replace(/(?!^)\+/g, '')
    .slice(0, 12);
};

export const CustomersView: React.FC = () => {
  const {
    customers,
    orders,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    settings
  } = useApp();
  const [search, setSearch] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const PAGE_SIZE = 10;

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Form State
  const [name, setName] = React.useState('');
  const [mobile, setMobile] = React.useState('');
  const [mobileError, setMobileError] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [dob, setDob] = React.useState('');
  const [gender, setGender] = React.useState('Male');
  const [address, setAddress] = React.useState('');
  const [membership, setMembership] = React.useState<'Silver' | 'Gold' | 'Premium' | 'VIP'>('Silver');
  const [photo, setPhoto] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const todayDate = getTodayForDateInput();

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setMobile('');
    setMobileError('');
    setEmail('');
    setDob('');
    setGender('Male');
    setAddress('');

    setPhoto('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.id);
    setName(c.name);
    setMobile(normalizeSriLankanMobile(c.mobile) || c.mobile);
    setMobileError('');
    setEmail(c.email);
    setDob(c.dob && c.dob <= todayDate ? c.dob : '');
    setGender(c.gender || 'Male');
    setAddress(c.address);

    setPhoto(c.photo || '');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    const cleanName = name.trim();
    const normalizedMobile = normalizeSriLankanMobile(mobile);

    if (!cleanName) {
      await Swal.fire({
        icon: 'warning',
        title: 'Customer name required',
        text: 'Please enter the Customer name.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!normalizedMobile) {
      setMobileError(
        'Enter a valid Sri Lankan mobile number, for example 0771234567.'
      );
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid mobile number',
        text: 'Please enter a valid Sri Lankan mobile number. Use 07XXXXXXXX, 947XXXXXXXX or +947XXXXXXXX.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    setMobileError('');

    if (dob && dob > todayDate) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid date of birth',
        text: 'Date of birth cannot be a future date.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    try {
      if (editingId) {
        await updateCustomer(
          editingId,
          {
            name: cleanName,
            mobile: normalizedMobile,
            email: email.trim(),
            dob,
            gender,
            address: address.trim(),

            photo,
            notes: notes.trim()
          }
        );
      } else {
        await addCustomer({
          name: cleanName,
          mobile: normalizedMobile,
          email: email.trim(),
          dob,
          gender,
          address: address.trim(),

          photo,
          notes: notes.trim(),
          status: 'Active'
        });
      }

      const wasEditing = Boolean(editingId);
      setIsModalOpen(false);

      await Swal.fire({
        icon: 'success',
        title: wasEditing ? 'Customer updated!' : 'Customer added!',
        text: `${cleanName} has been ${wasEditing ? 'updated' : 'added'} successfully.`,
        timer: 1600,
        showConfirmButton: false
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save Customer.';

      console.error(
        'Customer saving error:',
        error
      );

      await Swal.fire({
        icon: 'error',
        title: editingId ? 'Update failed' : 'Save failed',
        text: message,
        confirmButtonColor: '#f59e0b'
      });
    }
  };

  const handleDeleteCustomer = async (
    customer: Customer
  ): Promise<void> => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete customer?',
      html: `Are you sure you want to permanently delete <b>${customer.name}</b>?<br/><span style="font-size:12px;color:#6b7280">This action cannot be undone.</span>`,
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: 'Deleting...',
        text: `Removing ${customer.name}`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
      });

      await deleteCustomer(customer.id);

      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: `${customer.name} has been deleted successfully.`,
        timer: 1600,
        showConfirmButton: false
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to delete Customer.';

      console.error(
        'Customer deletion error:',
        error
      );

      await Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: message,
        confirmButtonColor: '#f59e0b'
      });
    }
  };

  const normalizePhoneForMatch = (value?: string | null): string =>
    (value || '').replace(/\D/g, '').replace(/^94(?=7\d{8}$)/, '0');

  const normalizeTextForMatch = (value?: string | null): string =>
    (value || '').trim().toLowerCase();

  const getOrderCustomerId = (order: any): string =>
    String(order.customerId ?? order.customer_id ?? order.customer?.id ?? '');

  const getOrderCustomerPhone = (order: any): string =>
    normalizePhoneForMatch(
      order.customerPhone ??
      order.customer_phone ??
      order.phone ??
      order.mobile ??
      order.customer?.mobile ??
      order.customer?.phone ??
      ''
    );

  const getOrderCustomerName = (order: any): string =>
    normalizeTextForMatch(
      order.customerName ??
      order.customer_name ??
      order.customer?.name ??
      ''
    );

  const getOrderTotal = (order: any): number => {
    const value =
      order.total ??
      order.totalAmount ??
      order.total_amount ??
      order.grandTotal ??
      order.grand_total ??
      order.amount ??
      0;

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  };

  const isCountableOrder = (order: any): boolean => {
    const status = String(order.status ?? order.orderStatus ?? '').toLowerCase();
    return !['cancelled', 'canceled', 'void', 'deleted'].includes(status);
  };

  const isPaidOrder = (order: any): boolean => {
    const paymentStatus = String(
      order.paymentStatus ?? order.payment_status ?? ''
    ).toLowerCase();

    return !paymentStatus ||
      ['paid', 'completed', 'complete'].includes(paymentStatus);
  };

  const customersWithStats = React.useMemo(() => {
    return customers.map(customer => {
      const customerPhone = normalizePhoneForMatch(customer.mobile);
      const customerName = normalizeTextForMatch(customer.name);

      const customerOrders = (orders || []).filter((order: any) => {
        if (!isCountableOrder(order)) return false;

        const orderCustomerId = getOrderCustomerId(order);
        if (orderCustomerId && orderCustomerId === String(customer.id)) {
          return true;
        }

        const orderPhone = getOrderCustomerPhone(order);
        if (customerPhone && orderPhone && customerPhone === orderPhone) {
          return true;
        }

        const orderName = getOrderCustomerName(order);
        return Boolean(
          customerName &&
          orderName &&
          customerName !== 'walk-in customer' &&
          customerName === orderName
        );
      });

      return {
        ...customer,
        totalOrders: customerOrders.length,
        totalSpent: customerOrders.reduce(
          (sum: number, order: any) =>
            sum + (isPaidOrder(order) ? getOrderTotal(order) : 0),
          0
        )
      };
    });
  }, [customers, orders]);

  const filteredCustomers = React.useMemo(() => customersWithStats.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  }), [customersWithStats, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE)
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCustomers = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  const startRow =
    filteredCustomers.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endRow = Math.min(
    currentPage * PAGE_SIZE,
    filteredCustomers.length
  );

  return (
    <div className="p-6 space-y-6 bg-[#FAF7F2] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 font-serif flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600" /> Customer Management
          </h1>
          <p className="text-xs text-gray-500">Manage customer profiles, wallets and purchase histories</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Table & Controls Container */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone..."
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Customer ID</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Mobile Number</th>
                <th className="py-3 px-3">Date of Birth</th>
                <th className="py-3 px-3">Total Orders</th>
                <th className="py-3 px-3">Total Spent</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {paginatedCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-gray-500">{c.id}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img src={c.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-gray-900">{c.name}</p>
                        <p className="text-[10px] text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-800">{c.mobile}</td>
                  <td className="py-3 px-3 text-gray-500">
                    {!c.dob
                      ? '—'
                      : c.dob <= todayDate
                        ? c.dob
                        : 'Invalid future date'}
                  </td>
                  <td className="py-3 px-3 text-gray-800 font-semibold">{c.totalOrders}</td>
                  <td className="py-3 px-3 font-bold text-emerald-700 font-mono">{settings.currency} {Number(c.totalSpent || 0).toFixed(2)}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-gray-500 hover:text-amber-600 rounded-lg hover:bg-gray-100"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          void handleDeleteCustomer(c);
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold text-gray-500">
              Showing{' '}
              <span className="font-black text-gray-800">
                {startRow}-{endRow}
              </span>{' '}
              of{' '}
              <span className="font-black text-gray-800">
                {filteredCustomers.length}
              </span>{' '}
              customers · 10 per page
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage(page => Math.max(1, page - 1))
                }
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-black text-amber-800">
                Page {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(page =>
                    Math.min(totalPages, page + 1)
                  )
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900 font-serif">
                {editingId ? 'Edit Customer Profile' : 'Register New Customer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Arun Kumar"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(sanitizeMobileInput(e.target.value));
                      if (mobileError) setMobileError('');
                    }}
                    onBlur={() => {
                      if (!mobile) return;

                      const normalizedMobile =
                        normalizeSriLankanMobile(mobile);

                      if (normalizedMobile) {
                        setMobile(normalizedMobile);
                        setMobileError('');
                      } else {
                        setMobileError(
                          'Enter a valid Sri Lankan mobile number, for example 0771234567.'
                        );
                      }
                    }}
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={10}
                    pattern="(07[0-9]{8}|947[0-9]{8}|\+947[0-9]{8})"
                    required
                    placeholder="e.g. 0771234567"
                    aria-invalid={Boolean(mobileError)}
                    aria-describedby="mobile-error"
                    className={`w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-medium focus:outline-none ${
                      mobileError
                        ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-2 focus:ring-amber-400'
                    }`}
                  />
                  {mobileError && (
                    <p
                      id="mobile-error"
                      className="mt-1 text-[10px] font-semibold text-red-600"
                    >
                      {mobileError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    max={todayDate}
                    onChange={async (e) => {
                      const selectedDate = e.target.value;

                      if (
                        selectedDate &&
                        selectedDate > todayDate
                      ) {
                        await Swal.fire({
                          icon: 'warning',
                          title: 'Invalid date of birth',
                          text: 'Date of birth cannot be a future date.',
                          confirmButtonColor: '#f59e0b'
                        });
                        setDob('');
                        return;
                      }

                      setDob(selectedDate);
                    }}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none text-gray-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 text-amber-950 font-extrabold rounded-xl text-xs hover:bg-amber-500 flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-4 h-4" /> Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};