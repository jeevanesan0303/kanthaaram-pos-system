import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import Swal from 'sweetalert2';
import { useApp } from '../../context/AppContext';

import {
  Supplier,
  SupplierPaymentType,
  // SupplierStatus
} from '../../types';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    suppliersLoading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    settings,
    currentUser
  } = useApp();

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [dateFilter, setDateFilter] =
    useState('');

  const [productFilter, setProductFilter] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [companyName, setCompanyName] =
    useState('');

  const [owner, setOwner] =
    useState('');

  const [phone, setPhone] =
    useState('');
  const [phoneError, setPhoneError] =
    useState('');

  const [currentPage, setCurrentPage] =
    useState(1);

  const PAGE_SIZE = 10;

  const [email, setEmail] =
    useState('');

  const [emailError, setEmailError] =
    useState('');

  const [quantityError, setQuantityError] =
    useState('');

  const [address, setAddress] =
    useState('');

  const [
    productsSupplied,
    setProductsSupplied
  ] = useState('');

  const [
    quantitySupplied,
    setQuantitySupplied
  ] = useState('');

  const [buyingPrice, setBuyingPrice] =
    useState<number>(0);

  

  const [paymentType, setPaymentType] =
    useState<SupplierPaymentType>('Pending');

  

  const canManage =
    currentUser?.role === 'Admin';

  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter(supplier => {
        const matchesDate =
          !dateFilter ||
          supplier.createdAt.startsWith(
            dateFilter
          );

        const search =
          productFilter
            .trim()
            .toLowerCase();

        const matchesProduct =
          !search ||
          supplier.products
            .toLowerCase()
            .includes(search) ||
          supplier.companyName
            .toLowerCase()
            .includes(search);

        return matchesDate && matchesProduct;
      }),
    [suppliers, dateFilter, productFilter]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSuppliers.length / PAGE_SIZE)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, productFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedSuppliers = useMemo(() => {
    const start =
      (currentPage - 1) * PAGE_SIZE;

    return filteredSuppliers.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredSuppliers, currentPage]);

  const startRow =
    filteredSuppliers.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endRow = Math.min(
    currentPage * PAGE_SIZE,
    filteredSuppliers.length
  );

  const resetForm = (): void => {
    setCompanyName('');
    setOwner('');
    setPhone('');
    setPhoneError('');
    setEmail('');
    setEmailError('');
    setQuantityError('');
    setAddress('');
    setProductsSupplied('');
    setQuantitySupplied('');
    setBuyingPrice(0);
   
    setPaymentType('Pending');
   
  };

  const handleOpenAdd = (): void => {
    if (!canManage) {
      void Swal.fire({
        icon: 'warning',
        title: 'Admin access required',
        text: 'Only an Admin can add suppliers.',
        confirmButtonColor: '#d97706',
      });

      return;
    }

    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (
    supplier: Supplier
  ): void => {
    if (!canManage) {
      void Swal.fire({
        icon: 'warning',
        title: 'Admin access required',
        text: 'Only an Admin can edit suppliers.',
        confirmButtonColor: '#d97706',
      });

      return;
    }

    setEditingId(supplier.id);
    setCompanyName(supplier.companyName);
    setOwner(supplier.owner);
    setPhone(supplier.phone.replace(/\D/g, '').slice(0, 10));
    setPhoneError('');
    setEmail(supplier.email || '');
    setEmailError('');
    setQuantityError('');
    setAddress(supplier.address);
    setProductsSupplied(supplier.products);
    setQuantitySupplied(
      supplier.quantitySupplied
    );
    setBuyingPrice(supplier.buyingPrice);
   
    setPaymentType(supplier.paymentType);
    // setStatus(supplier.status);
    setIsModalOpen(true);
  };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!canManage) {
      await Swal.fire({
        icon: 'warning',
        title: 'Admin access required',
        text: 'Only an Admin can save suppliers.',
        confirmButtonColor: '#d97706',
      });

      return;
    }

    if (!companyName.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Company name required',
        text: 'Please enter the supplier company name.',
        confirmButtonColor: '#d97706',
      });
      return;
    }

    

    if (!/^0\d{9}$/.test(phone)) {
      setPhoneError(
        'Enter a valid Sri Lankan 10-digit phone number, e.g. 0771234567.'
      );
      return;
    }

    setPhoneError('');

    const cleanEmail = email.trim();

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)
    ) {
      setEmailError(
        'Enter a valid email address, e.g. supplier@example.com.'
      );
      return;
    }

    setEmailError('');

    const cleanQuantity = quantitySupplied.trim();

    if (
      cleanQuantity &&
      !/^\d+$/.test(cleanQuantity)
    ) {
      setQuantityError(
        'Quantity must contain numbers only.'
      );
      return;
    }

    if (
      cleanQuantity &&
      Number(cleanQuantity) <= 0
    ) {
      setQuantityError(
        'Quantity must be greater than 0.'
      );
      return;
    }

    setQuantityError('');

    try {
      setSaving(true);

      const supplierData = {
        companyName,
        owner,
        phone,
        email: cleanEmail,
        address,
        products: productsSupplied,
        quantitySupplied: cleanQuantity,
        buyingPrice,
       
        paymentType,
        
      };

      if (editingId) {
        await updateSupplier(
          editingId,
          supplierData
        );

        await Swal.fire({
          icon: 'success',
          title: 'Supplier updated!',
          text: `${companyName.trim()} was updated successfully.`,
          timer: 1600,
          showConfirmButton: false,
        });
      } else {
        await addSupplier(supplierData);

        await Swal.fire({
          icon: 'success',
          title: 'Supplier added!',
          text: `${companyName.trim()} was added successfully.`,
          timer: 1600,
          showConfirmButton: false,
        });
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: editingId
          ? 'Update failed'
          : 'Save failed',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to save supplier.',
        confirmButtonColor: '#d97706',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    supplier: Supplier
  ): Promise<void> => {
    if (!canManage) {
      await Swal.fire({
        icon: 'warning',
        title: 'Admin access required',
        text: 'Only an Admin can delete suppliers.',
        confirmButtonColor: '#d97706',
      });

      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete supplier?',
      text: `This will permanently delete ${supplier.companyName}.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (!result.isConfirmed) return;

    try {
      setSaving(true);

      await deleteSupplier(supplier.id);

      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: `${supplier.companyName} was deleted successfully.`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text:
          error instanceof Error
            ? error.message
            : 'Unable to delete supplier.',
        confirmButtonColor: '#d97706',
      });
    } finally {
      setSaving(false);
    }
  };

  const paymentBadge = (
    value: SupplierPaymentType
  ): string => {
    switch (value) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800';

      case 'Bank Transfer':
        return 'bg-blue-100 text-blue-800';

      case 'Pending':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#FAF7F2] min-h-screen">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 font-serif flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" />
            Supplier Management
          </h1>

          <p className="text-xs text-gray-500">
            Track vendors, supplied products and payments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={productFilter}
            onChange={event =>
              setProductFilter(event.target.value)
            }
            placeholder="Search product/company..."
            className="p-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
          />

          <input
            type="date"
            value={dateFilter}
            onChange={event =>
              setDateFilter(event.target.value)
            }
            className="p-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
          />

          {(productFilter || dateFilter) && (
            <button
              type="button"
              onClick={() => {
                setProductFilter('');
                setDateFilter('');
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAdd}
            disabled={!canManage || saving}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-amber-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-gray-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Company</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Products</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Buying Price</th>
                {/* <th className="py-3 px-3">Balance</th> */}
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Created</th>
                {/* <th className="py-3 px-3">Status</th> */}
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {paginatedSuppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td className="py-3 px-3 font-bold">
                    {supplier.companyName}
                  </td>

                  <td className="py-3 px-3">
                    <div>{supplier.owner || '-'}</div>
                    <div className="text-[10px] text-gray-400">
                      {supplier.phone || '-'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {supplier.email || '-'}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {supplier.products || '-'}
                  </td>

                  <td className="py-3 px-3">
                    {supplier.quantitySupplied || '-'}
                  </td>

                  <td className="py-3 px-3 font-mono font-bold">
                    {settings.currency}{' '}
                    {supplier.buyingPrice.toFixed(2)}
                  </td>

                  {/* <td className="py-3 px-3 font-mono font-bold text-red-600">
                    {settings.currency}{' '}
                    {supplier.balance.toFixed(2)}
                  </td> */}

                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${paymentBadge(supplier.paymentType)}`}>
                      {supplier.paymentType}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {new Date(
                      supplier.createdAt
                    ).toLocaleDateString()}
                  </td>

                  {/* <td className="py-3 px-3">
                    {supplier.status}
                  </td> */}

                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenEdit(supplier)
                      }
                      disabled={!canManage}
                      className="p-1.5 text-gray-500 hover:text-amber-600 disabled:opacity-40"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleDelete(supplier)
                      }
                      disabled={!canManage}
                      className="p-1.5 text-gray-500 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {suppliersLoading && (
                <tr>
                  <td colSpan={10} className="py-8 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              )}

              {!suppliersLoading &&
                filteredSuppliers.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-8 text-center text-gray-400"
                    >
                      No suppliers found.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {!suppliersLoading && filteredSuppliers.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold text-gray-500">
              Showing{' '}
              <span className="font-black text-gray-800">
                {startRow}-{endRow}
              </span>{' '}
              of{' '}
              <span className="font-black text-gray-800">
                {filteredSuppliers.length}
              </span>{' '}
              suppliers · 10 per page
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage(page =>
                    Math.max(1, page - 1)
                  )
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between border-b pb-2">
              <h3 className="font-bold text-sm">
                {editingId
                  ? 'Edit Supplier'
                  : 'Add New Supplier'}
              </h3>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

           <form
  onSubmit={handleSave}
  className="space-y-3"
>
  {/* Company name */}
  <div>
    <label
      htmlFor="supplier-company-name"
      className="text-xs font-bold text-gray-700 block mb-1"
    >
      Company Name *
    </label>

    <input
      id="supplier-company-name"
      type="text"
      required
      value={companyName}
      onChange={event =>
        setCompanyName(event.target.value)
      }
      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
    />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    {/* Sales representative */}
    <div>
      <label
        htmlFor="supplier-owner"
        className="text-xs font-bold text-gray-700 block mb-1"
      >
        Sales Representative
      </label>

      <input
        id="supplier-owner"
        type="text"
        value={owner}
        onChange={event =>
          setOwner(event.target.value)
        }
        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
    </div>

    {/* Phone */}
    <div>
      <label
        htmlFor="supplier-phone"
        className="text-xs font-bold text-gray-700 block mb-1"
      >
        Phone Number
      </label>

      <input
        id="supplier-phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        required
        maxLength={10}
        pattern="0[0-9]{9}"
        value={phone}
        placeholder="e.g. 0771234567"
        onChange={event => {
          const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 10);
          setPhone(digitsOnly);
          if (phoneError) setPhoneError('');
        }}
        onBlur={() => {
          if (phone && !/^0\d{9}$/.test(phone)) {
            setPhoneError('Sri Lankan phone number must be exactly 10 digits and start with 0.');
          }
        }}
        aria-invalid={Boolean(phoneError)}
        aria-describedby="supplier-phone-error"
        className={`w-full p-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:ring-1 ${
          phoneError ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-amber-400'
        }`}
      />
      {phoneError && (
        <p id="supplier-phone-error" className="mt-1 text-[10px] font-semibold text-red-600">
          {phoneError}
        </p>
      )}
    </div>
  </div>

  {/* Email */}
  <div>
    <label
      htmlFor="supplier-email"
      className="text-xs font-bold text-gray-700 block mb-1"
    >
      Email Address
    </label>

    <input
      id="supplier-email"
      type="email"
      inputMode="email"
      autoComplete="email"
      value={email}
      placeholder="e.g. supplier@example.com"
      onChange={event => {
        setEmail(event.target.value);

        if (emailError) {
          setEmailError('');
        }
      }}
      onBlur={() => {
        const cleanEmail = email.trim();

        if (
          cleanEmail &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)
        ) {
          setEmailError(
            'Enter a valid email address, e.g. supplier@example.com.'
          );
        } else {
          setEmailError('');
        }
      }}
      aria-invalid={Boolean(emailError)}
      aria-describedby="supplier-email-error"
      className={`w-full p-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:ring-1 ${
        emailError
          ? 'border-red-400 focus:ring-red-300'
          : 'border-gray-200 focus:ring-amber-400'
      }`}
    />

    {emailError && (
      <p
        id="supplier-email-error"
        className="mt-1 text-[10px] font-semibold text-red-600"
      >
        {emailError}
      </p>
    )}
  </div>

  {/* Address */}
  <div>
    <label
      htmlFor="supplier-address"
      className="text-xs font-bold text-gray-700 block mb-1"
    >
      Address
    </label>

    <textarea
      id="supplier-address"
      rows={3}
      value={address}
      onChange={event =>
        setAddress(event.target.value)
      }
      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
    />
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    {/* Products */}
    <div>
      <label
        htmlFor="supplier-products"
        className="text-xs font-bold text-gray-700 block mb-1"
      >
        Products Supplied
      </label>

      <input
        id="supplier-products"
        type="text"
        value={productsSupplied}
        onChange={event =>
          setProductsSupplied(
            event.target.value
          )
        }
        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
    </div>

    {/* Quantity */}
    <div>
      <label
        htmlFor="supplier-quantity"
        className="text-xs font-bold text-gray-700 block mb-1"
      >
        Quantity Supplied
      </label>

      <input
        id="supplier-quantity"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={quantitySupplied}
        placeholder="e.g. 100"
        onChange={event => {
          const digitsOnly =
            event.target.value
              .replace(/\D/g, '')
              .replace(/^0+(?=\d)/, '');

          setQuantitySupplied(digitsOnly);

          if (quantityError) {
            setQuantityError('');
          }
        }}
        onBlur={() => {
          const cleanQuantity =
            quantitySupplied.trim();

          if (
            cleanQuantity &&
            !/^\d+$/.test(cleanQuantity)
          ) {
            setQuantityError(
              'Quantity must contain numbers only.'
            );
          } else if (
            cleanQuantity &&
            Number(cleanQuantity) <= 0
          ) {
            setQuantityError(
              'Quantity must be greater than 0.'
            );
          } else {
            setQuantityError('');
          }
        }}
        aria-invalid={Boolean(quantityError)}
        aria-describedby="supplier-quantity-error"
        className={`w-full p-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:ring-1 ${
          quantityError
            ? 'border-red-400 focus:ring-red-300'
            : 'border-gray-200 focus:ring-amber-400'
        }`}
      />

      {quantityError && (
        <p
          id="supplier-quantity-error"
          className="mt-1 text-[10px] font-semibold text-red-600"
        >
          {quantityError}
        </p>
      )}
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    {/* Buying price */}
    <div>
      <label
        htmlFor="supplier-buying-price"
        className="text-xs font-bold text-gray-700 block mb-1"
      >
        Buying Price ({settings.currency})
      </label>

      <input
        id="supplier-buying-price"
        type="number"
        min="0"
        step="0.01"
        value={buyingPrice}
        onChange={event =>
          setBuyingPrice(
            Number(event.target.value)
          )
        }
        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
    </div>

    {/* Payment type */}
    <div>
      <label
        htmlFor="supplier-payment-type"
        className="text-xs font-bold text-gray-700 block mb-1"
      >
        Payment Type *
      </label>

      <select
        id="supplier-payment-type"
        required
        value={paymentType}
        onChange={event =>
          setPaymentType(
            event.target
              .value as SupplierPaymentType
          )
        }
        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
      >
        <option value="Paid">
          Paid
        </option>

        <option value="Bank Transfer">
          Bank Transfer
        </option>

        <option value="Pending">
          Pending
        </option>
      </select>
    </div>
  </div>

  <button
    type="submit"
    disabled={saving}
    className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
  >
    {saving && (
      <Loader2 className="w-4 h-4 animate-spin" />
    )}

    {saving
      ? 'Saving...'
      : editingId
        ? 'Save Changes'
        : 'Create Supplier'}
  </button>
</form>
          </div>
        </div>
      )}
    </div>
  );
};