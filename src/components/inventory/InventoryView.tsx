import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  PackageCheck,
  AlertTriangle,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import Swal from 'sweetalert2';

import { useApp } from '../../context/AppContext';

import {
  InventoryItem,
  InventoryMovementType
} from '../../types';

export const InventoryView: React.FC = () => {
  const {
  inventoryItems,
  inventoryLoading,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryStock,

  // Categories loaded from Supabase category table
  categories,

  settings,
  currentUser
} = useApp();

  // Stock adjustment states
  const [
    selectedInventoryId,
    setSelectedInventoryId
  ] = useState<string>('');

  const [adjustQty, setAdjustQty] =
    useState<number>(10);

  const [adjustType, setAdjustType] =
    useState<InventoryMovementType>('Stock In');

  const [adjustReason, setAdjustReason] =
    useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] =
    useState<boolean>(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [dateFilter, setDateFilter] =
    useState<string>('');

  const [search, setSearch] =
    useState<string>('');

  const [currentPage, setCurrentPage] =
    useState<number>(1);

  const PAGE_SIZE = 10;

  const [saving, setSaving] =
    useState<boolean>(false);

  // Form states
  const [name, setName] =
    useState<string>('');

  const [category, setCategory] =
    useState<string>('Tea');

  const [stock, setStock] =
    useState<number>(100);

  const [originalStock, setOriginalStock] =
    useState<number>(100);

  const [lowStockAlert, setLowStockAlert] =
    useState<number>(10);

  const [unit, setUnit] =
    useState<string>('Cup');

  const [sku, setSku] =
    useState<string>('');

  const [price, setPrice] =
    useState<number>(20);

  // SQL security permits only Admin to manage inventory.
  const canManageInventory =
    currentUser?.role === 'Admin';

  const selectedInventoryItem =
    inventoryItems.find(
      item => item.id === selectedInventoryId
    );

  // Get category names only from inventory items.
  // This does not connect to the category or product tables.
  const inventoryCategories = useMemo(
    () =>
      Array.from(
        new Set(
          inventoryItems
            .map(item => item.category)
            .filter(Boolean)
        )
      ),
    [inventoryItems]
  );

  const lowStockItems = useMemo(
    () =>
      inventoryItems.filter(
        item =>
          item.status === 'Active' &&
          item.stock <= item.lowStockAlert
      ),
    [inventoryItems]
  );

  const filteredInventoryItems = useMemo(
    () =>
      inventoryItems.filter(item => {
        const term = search.trim().toLowerCase();

        const matchesDate =
          !dateFilter ||
          item.createdAt.startsWith(dateFilter);

        const matchesSearch =
          !term ||
          item.name.toLowerCase().includes(term) ||
          (item.category || '').toLowerCase().includes(term) ||
          (item.sku || '').toLowerCase().includes(term) ||
          (item.unit || '').toLowerCase().includes(term);

        return matchesDate && matchesSearch;
      }),
    [inventoryItems, dateFilter, search]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInventoryItems.length / PAGE_SIZE)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedInventoryItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredInventoryItems.slice(start, start + PAGE_SIZE);
  }, [filteredInventoryItems, currentPage]);

  const startRow =
    filteredInventoryItems.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endRow = Math.min(
    currentPage * PAGE_SIZE,
    filteredInventoryItems.length
  );

  // Select first inventory item after loading.
  useEffect(() => {
    if (inventoryItems.length === 0) {
      setSelectedInventoryId('');
      return;
    }

    const selectedItemStillExists =
      inventoryItems.some(
        item => item.id === selectedInventoryId
      );

    if (!selectedItemStillExists) {
      setSelectedInventoryId(
        inventoryItems[0].id
      );
    }
  }, [inventoryItems, selectedInventoryId]);

  const handleAdjust = async (): Promise<void> => {
    if (!canManageInventory) {
      await Swal.fire({
        icon: 'warning',
        title: 'Admin access required',
        text: 'Only an Admin can adjust inventory stock.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!selectedInventoryItem) {
      await Swal.fire({
        icon: 'warning',
        title: 'Select an item',
        text: 'Please select an inventory item.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!Number.isFinite(adjustQty) || adjustQty <= 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid quantity',
        text: 'Adjustment quantity must be greater than zero.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (
      adjustType === 'Stock Out' &&
      adjustQty > selectedInventoryItem.stock
    ) {
      await Swal.fire({
        icon: 'error',
        title: 'Insufficient stock',
        text: `Only ${selectedInventoryItem.stock} ${selectedInventoryItem.unit} available.`,
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const actionText = adjustType === 'Stock In' ? 'add' : 'deduct';
    const confirmation = await Swal.fire({
      icon: 'question',
      title: `${adjustType}?`,
      html: `Are you sure you want to <b>${actionText} ${adjustQty} ${selectedInventoryItem.unit}</b> ${adjustType === 'Stock In' ? 'to' : 'from'} <b>${selectedInventoryItem.name}</b>?`,
      showCancelButton: true,
      confirmButtonText: `Yes, ${adjustType}`,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280'
    });

    if (!confirmation.isConfirmed) return;

    try {
      setSaving(true);

      Swal.fire({
        title: 'Updating stock...',
        text: `${adjustType} in progress`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
      });

      await adjustInventoryStock(
        selectedInventoryItem.id,
        adjustType,
        adjustQty,
        adjustReason
      );

      setAdjustReason('');

      await Swal.fire({
        icon: 'success',
        title: 'Stock updated!',
        text: `${adjustType} completed successfully for ${selectedInventoryItem.name}.`,
        timer: 1600,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Stock adjustment failed',
        text: error instanceof Error
          ? error.message
          : 'Unable to adjust inventory stock.',
        confirmButtonColor: '#f59e0b'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = (): void => {
    if (!canManageInventory) {
      void Swal.fire({
        icon: 'warning',
        title: 'Admin access required',
        text: 'Only an Admin can add inventory items.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    setEditingId(null);
    setName('');
    setCategory(
      inventoryCategories[0] || 'Tea'
    );
    setStock(100);
    setOriginalStock(100);
    setLowStockAlert(10);
    setUnit('Cup');
    setSku('');
    setPrice(20);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (
    item: InventoryItem
  ): void => {
    if (!canManageInventory) {
      void Swal.fire({
        icon: 'warning',
        title: 'Admin access required',
        text: 'Only an Admin can edit inventory items.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    setEditingId(item.id);
    setName(item.name);

    const matchingCategory = categories.find(
      categoryItem =>
        categoryItem.name.trim().toLowerCase() ===
        (item.category || '').trim().toLowerCase()
    );

    // Keep the item's saved category selected in Edit mode.
    // If the Supabase category exists with different casing, use its exact name.
    setCategory(
      matchingCategory?.name || item.category || ''
    );

    setStock(item.stock);
    setOriginalStock(item.stock);
    setLowStockAlert(item.lowStockAlert);
    setUnit(item.unit);
    setSku(item.sku || '');
    setPrice(item.price);
    setIsModalOpen(true);
  };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!canManageInventory) {
      await Swal.fire({
        icon: 'warning',
        title: 'Admin access required',
        text: 'Only an Admin can save inventory items.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!name.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Item name required',
        text: 'Please enter an inventory item name.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!category) {
      await Swal.fire({
        icon: 'warning',
        title: 'Category required',
        text: 'Please select a category.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!unit.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Unit required',
        text: 'Please enter a stock unit.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!Number.isFinite(stock) || stock < 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid stock',
        text: 'Stock cannot be negative.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!Number.isFinite(lowStockAlert) || lowStockAlert < 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid alert quantity',
        text: 'Low-stock alert cannot be negative.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid price',
        text: 'Price cannot be negative.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await updateInventoryItem(editingId, {
          name: name.trim(),
          category,
          lowStockAlert,
          unit: unit.trim(),
          sku: sku.trim(),
          price
        });

        const stockDifference = stock - originalStock;

        if (stockDifference > 0) {
          await adjustInventoryStock(
            editingId,
            'Stock In',
            stockDifference,
            'Stock quantity changed from Edit Stock Item'
          );
        }

        if (stockDifference < 0) {
          await adjustInventoryStock(
            editingId,
            'Stock Out',
            Math.abs(stockDifference),
            'Stock quantity changed from Edit Stock Item'
          );
        }
      } else {
        await addInventoryItem({
          name: name.trim(),
          category,
          stock,
          lowStockAlert,
          unit: unit.trim(),
          sku: sku.trim(),
          price,
          status: 'Active'
        });
      }

      const wasEditing = Boolean(editingId);
      setIsModalOpen(false);

      await Swal.fire({
        icon: 'success',
        title: wasEditing ? 'Stock item updated!' : 'Stock item created!',
        text: `${name.trim()} has been ${wasEditing ? 'updated' : 'added'} successfully.`,
        timer: 1600,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: editingId ? 'Update failed' : 'Create failed',
        text: error instanceof Error
          ? error.message
          : 'Unable to save inventory item.',
        confirmButtonColor: '#f59e0b'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    item: InventoryItem
  ): Promise<void> => {
    if (!canManageInventory) {
      await Swal.fire({
        icon: 'warning',
        title: 'Admin access required',
        text: 'Only an Admin can delete inventory items.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete inventory item?',
      html: `Are you sure you want to permanently delete <b>${item.name}</b>?<br/><span style="font-size:12px;color:#6b7280">This action cannot be undone.</span>`,
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
      setSaving(true);

      Swal.fire({
        title: 'Deleting...',
        text: `Removing ${item.name}`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading()
      });

      await deleteInventoryItem(item.id);

      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: `${item.name} deleted successfully.`,
        timer: 1600,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: error instanceof Error
          ? error.message
          : 'Unable to delete inventory item.',
        confirmButtonColor: '#f59e0b'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[#FAF7F2] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 font-serif flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-amber-600" />

            Inventory & Stock Adjustments
          </h1>

          <p className="text-xs text-gray-500">
            Monitor stock levels, execute stock-in/stock-out
            entries and low stock alerts
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          disabled={!canManageInventory || saving}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-amber-950 font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />

          Add Stock Item
        </button>
      </div>

      {/* Low Stock Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between shadow-3xs">
          <div className="flex items-center gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />

            <div>
              <p className="font-bold text-amber-900">
                Low Stock Alert ({lowStockItems.length} Items)
              </p>

              <p className="text-amber-700">
                {lowStockItems
                  .map(item => item.name)
                  .join(', ')}{' '}
                are running below the safety threshold.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Form */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-gray-900 font-serif">
          Quick Stock Adjustment Entry
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {/* Select item */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Select Item
            </label>

            <select
              value={selectedInventoryId}
              onChange={event =>
                setSelectedInventoryId(
                  event.target.value
                )
              }
              disabled={
                inventoryLoading ||
                inventoryItems.length === 0
              }
              className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-bold text-gray-800 focus:outline-none disabled:opacity-50"
            >
              {inventoryItems
                .filter(
                  item => item.status === 'Active'
                )
                .map(item => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name} (Stock: {item.stock})
                  </option>
                ))}
            </select>
          </div>

          {/* Adjustment type */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Adjustment Action
            </label>

            <select
              value={adjustType}
              onChange={event =>
                setAdjustType(
                  event.target
                    .value as InventoryMovementType
                )
              }
              className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-bold focus:outline-none"
            >
              <option value="Stock In">
                Stock In (Add)
              </option>

              <option value="Stock Out">
                Stock Out (Deduct)
              </option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Quantity
            </label>

            <input
              type="number"
              min="0.001"
              step="0.001"
              value={adjustQty}
              onChange={event =>
                setAdjustQty(
                  Number(event.target.value)
                )
              }
              className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-bold focus:outline-none"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Reason
            </label>

            <input
              type="text"
              value={adjustReason}
              onChange={event =>
                setAdjustReason(
                  event.target.value
                )
              }
              placeholder="Purchase / wastage"
              className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs focus:outline-none"
            />
          </div>

          {/* Apply button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void handleAdjust()}
              disabled={
                !canManageInventory ||
                saving ||
                !selectedInventoryItem ||
                adjustQty <= 0
              }
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-amber-950 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}

              Apply Stock Adjustment
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Master Table */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-gray-900 font-serif">
            Inventory Master List
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={event =>
                  setSearch(event.target.value)
                }
                placeholder="Search item, category, SKU..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <input
              type="date"
              value={dateFilter}
              onChange={event =>
                setDateFilter(event.target.value)
              }
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            />

            {(dateFilter || search) && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter('');
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Clear filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b text-gray-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">
                  Item Name
                </th>

                <th className="py-2.5 px-3">
                  Category
                </th>

                <th className="py-2.5 px-3">
                  SKU
                </th>

                <th className="py-2.5 px-3">
                  Threshold Alert
                </th>

                <th className="py-2.5 px-3">
                  In Stock
                </th>

                <th className="py-2.5 px-3">
                  Status
                </th>

                <th className="py-2.5 px-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 font-medium">
              {paginatedInventoryItems.map(item => (
                <tr
                  key={item.id}
                  className="hover:bg-amber-50/20 transition-colors"
                >
                  <td className="py-2.5 px-3 font-bold text-gray-900">
                    {item.name}
                  </td>

                  <td className="py-2.5 px-3 text-gray-600">
                    {item.category}
                  </td>

                  <td className="py-2.5 px-3 font-mono text-gray-400">
                    {item.sku || '-'}
                  </td>

                  <td className="py-2.5 px-3 text-gray-500">
                    {item.lowStockAlert} {item.unit}
                  </td>

                  <td className="py-2.5 px-3 font-black text-amber-800">
                    {item.stock}
                  </td>

                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.stock <=
                        item.lowStockAlert
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.stock <=
                      item.lowStockAlert
                        ? 'Low Stock'
                        : 'In Stock'}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenEdit(item)
                        }
                        disabled={
                          !canManageInventory ||
                          saving
                        }
                        className="p-1.5 text-gray-500 hover:text-amber-600 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Edit inventory item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDelete(item)
                        }
                        disabled={
                          !canManageInventory ||
                          saving
                        }
                        className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Delete inventory item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!inventoryLoading &&
                filteredInventoryItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-gray-400"
                    >
                      No inventory items found.
                    </td>
                  </tr>
                )}

              {inventoryLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />

                      Loading inventory...
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!inventoryLoading && filteredInventoryItems.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold text-gray-500">
              Showing{' '}
              <span className="font-black text-gray-800">
                {startRow}-{endRow}
              </span>{' '}
              of{' '}
              <span className="font-black text-gray-800">
                {filteredInventoryItems.length}
              </span>{' '}
              inventory items · 10 per page
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

      {/* Add/Edit Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-sm text-gray-900 font-serif">
                {editingId
                  ? 'Edit Stock Item'
                  : 'Add Stock Item'}
              </h3>

              <button
                type="button"
                onClick={() =>
                  setIsModalOpen(false)
                }
                disabled={saving}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="space-y-3"
            >
              {/* Item name */}
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">
                  Item Name *
                </label>

                <input
                  type="text"
                  required
                  placeholder="e.g. Cardamom Powder"
                  value={name}
                  onChange={event =>
                    setName(event.target.value)
                  }
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-1">
                    Category *
                  </label>

                  <select
                        required
                        value={category}
                        onChange={event =>
                          setCategory(event.target.value)
                        }
                        className="w-full p-2 bg-[#FAF7F2] border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                      >
                        <option value="">
                          Select category
                        </option>

                        {editingId &&
                          category &&
                          !categories.some(
                            categoryItem =>
                              categoryItem.name.trim().toLowerCase() ===
                              category.trim().toLowerCase()
                          ) && (
                            <option value={category}>
                              {category}
                            </option>
                          )}

                        {categories.map(categoryItem => (
                          <option
                            key={categoryItem.id}
                            value={categoryItem.name}
                          >
                            {categoryItem.name}
                          </option>
                        ))}
                      </select>
                </div>

                {/* SKU */}
                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-1">
                    SKU
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. INV-1001"
                    value={sku}
                    onChange={event =>
                      setSku(event.target.value)
                    }
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Stock */}
                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-1">
                    {editingId
                      ? 'Current Stock'
                      : 'Initial Stock *'}
                  </label>

                  <input
  type="number"
  min="0"
  step="0.001"
  required
  value={stock}
  onChange={event =>
    setStock(
      Number(event.target.value)
    )
  }
  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
/>
                </div>

                {/* Alert */}
                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-1">
                    Alert Qty *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    required
                    value={lowStockAlert}
                    onChange={event =>
                      setLowStockAlert(
                        Number(event.target.value)
                      )
                    }
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-1">
                    Unit *
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="pcs / kg"
                    value={unit}
                    onChange={event =>
                      setUnit(event.target.value)
                    }
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">
                  Selling Price ({settings.currency}) *
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={price}
                  onChange={event =>
                    setPrice(
                      Number(event.target.value)
                    )
                  }
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={
                  saving || !canManageInventory
                }
                className="w-full py-2 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-amber-950 font-extrabold text-xs rounded-xl shadow-xs transition-all mt-2 flex items-center justify-center gap-2"
              >
                {saving && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                {editingId
                  ? 'Save Changes'
                  : 'Create Stock Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};