import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Receipt,
  Plus,
  Trash2,
  X,
  DollarSign,
  Pencil,
  Loader2,
  AlertCircle,
  CircleCheckBig,
  CalendarDays,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { useApp } from '../../context/AppContext';

const getToday = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    expensesLoading,
    refreshExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    currentUser,
    settings,
  } = useApp();

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [
    editingExpenseId,
    setEditingExpenseId,
  ] = useState<string | null>(null);

  const [dateFilter, setDateFilter] =
    useState('');

  const [category, setCategory] =
    useState('');

  const [amount, setAmount] =
    useState('');

  const [expenseDate, setExpenseDate] =
    useState(getToday());

  const [notes, setNotes] =
    useState('');

  const [receiptImage, setReceiptImage] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const [currentPage, setCurrentPage] =
    useState(1);

  const PAGE_SIZE = 10;

  const resetForm = () => {
    setEditingExpenseId(null);
    setCategory('');
    setAmount('');
    setExpenseDate(getToday());
    setNotes('');
    setReceiptImage('');
  };

  const openAddModal = () => {
    resetForm();
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (
    expenseId: string,
  ) => {
    const selectedExpense = expenses.find(
      (expense) =>
        expense.id === expenseId,
    );

    if (!selectedExpense) {
      setErrorMessage(
        'The selected expense was not found.',
      );
      return;
    }

    setEditingExpenseId(
      selectedExpense.id,
    );

    setCategory(
      selectedExpense.category,
    );

    setAmount(
      String(selectedExpense.amount),
    );

    setExpenseDate(
      selectedExpense.date &&
      selectedExpense.date <= getToday()
        ? selectedExpense.date
        : getToday(),
    );

    setNotes(
      selectedExpense.notes ?? '',
    );

    setReceiptImage(
      selectedExpense.receiptImage ?? '',
    );

    setErrorMessage('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    resetForm();
  };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    const cleanCategory =
      category.trim();

    const numericAmount =
      Number(amount);

    if (!cleanCategory) {
      setErrorMessage(
        'Please enter the expense category.',
      );
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setErrorMessage(
        'Please enter a valid amount greater than zero.',
      );
      return;
    }

    if (!expenseDate) {
      setErrorMessage(
        'Please select the expense date.',
      );
      return;
    }

    const today = getToday();

    if (expenseDate > today) {
      setErrorMessage(
        'Expense date cannot be a future date.',
      );
      return;
    }

    setIsSaving(true);

    try {
      if (editingExpenseId) {
        await updateExpense(
          editingExpenseId,
          {
            category: cleanCategory,
            amount: numericAmount,
            date: expenseDate,
            notes: notes.trim(),
            receiptImage:
              receiptImage.trim(),
          },
        );

        setSuccessMessage(
          'Expense updated successfully.',
        );
      } else {
        await addExpense({
          category: cleanCategory,
          amount: numericAmount,
          date: expenseDate,
          notes: notes.trim(),
          receiptImage:
            receiptImage.trim(),
          addedBy:
            currentUser?.name || 'Admin',
        });

        setSuccessMessage(
          'Expense added successfully.',
        );
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : editingExpenseId
            ? 'Unable to update expense.'
            : 'Unable to add expense.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (
    id: string,
    expenseCategory: string,
  ) => {
    const confirmed = window.confirm(
      `Delete the "${expenseCategory}" expense record?`,
    );

    if (!confirmed) return;

    setDeletingId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deleteExpense(id);

      setSuccessMessage(
        'Expense deleted successfully.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete expense.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredExpenses = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          !dateFilter ||
          expense.date === dateFilter,
      ),
    [expenses, dateFilter],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExpenses.length / PAGE_SIZE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedExpenses = useMemo(() => {
    const start =
      (currentPage - 1) * PAGE_SIZE;

    return filteredExpenses.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [filteredExpenses, currentPage]);

  const startRow =
    filteredExpenses.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endRow = Math.min(
    currentPage * PAGE_SIZE,
    filteredExpenses.length,
  );

  const totalExpense = useMemo(
    () =>
      filteredExpenses.reduce(
        (total, expense) =>
          total + expense.amount,
        0,
      ),
    [filteredExpenses],
  );

  return (
    <div className="min-h-screen space-y-6 bg-[#FAF7F2] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-xl font-black text-gray-900">
            <Receipt className="h-6 w-6 text-amber-600" />
            Expenses Tracker
          </h1>

          <p className="text-xs text-gray-500">
            Record daily store utility bills,
            raw ingredient purchases and overhead
            costs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFilter}
              max={getToday()}
              onChange={(event) => {
                const selectedDate =
                  event.target.value;

                if (
                  selectedDate &&
                  selectedDate > getToday()
                ) {
                  setDateFilter('');
                  setErrorMessage(
                    'Filter date cannot be a future date.',
                  );
                  return;
                }

                setErrorMessage('');
                setDateFilter(selectedDate);
              }}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white p-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            {dateFilter && (
              <button
                type="button"
                onClick={() =>
                  setDateFilter('')
                }
                className="rounded-xl bg-red-50 px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-amber-950 shadow-md hover:bg-amber-500"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
          <CircleCheckBig className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <span className="block text-xs font-bold text-gray-700">
              {dateFilter
                ? 'Filtered Expenses'
                : 'Total Recorded Expenses'}
            </span>

            <span className="text-[11px] text-gray-400">
              {filteredExpenses.length}{' '}
              record(s)
            </span>
          </div>

          <span className="font-mono text-lg font-black text-red-600">
            {settings.currency}{' '}
            {totalExpense.toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          </span>
        </div>

        {expensesLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-xs font-semibold text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            Loading expenses...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold uppercase text-gray-400">
                  <th className="px-3 py-3">
                    Date
                  </th>

                  <th className="px-3 py-3">
                    Expense Category
                  </th>

                  <th className="px-3 py-3">
                    Notes / Details
                  </th>

                  <th className="px-3 py-3">
                    Added By
                  </th>

                  <th className="px-3 py-3">
                    Amount
                  </th>

                  <th className="px-3 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50 font-medium">
                {paginatedExpenses.map(
                  (expense) => (
                    <tr
                      key={expense.id}
                      className="transition-colors hover:bg-amber-50/30"
                    >
                      <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                        {expense.date}
                      </td>

                      <td className="px-3 py-3 font-bold text-gray-900">
                        {expense.category}
                      </td>

                      <td
                        className="max-w-64 truncate px-3 py-3 text-gray-600"
                        title={expense.notes}
                      >
                        {expense.notes || '—'}
                      </td>

                      <td className="px-3 py-3 text-gray-500">
                        {expense.addedBy}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 font-mono font-extrabold text-red-600">
                        {settings.currency}{' '}
                        {expense.amount.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                expense.id,
                              )
                            }
                            disabled={
                              deletingId ===
                              expense.id
                            }
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                            title="Edit expense"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(
                                expense.id,
                                expense.category,
                              )
                            }
                            disabled={
                              deletingId ===
                              expense.id
                            }
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Delete expense"
                          >
                            {deletingId ===
                            expense.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-14 text-center text-gray-400"
                    >
                      No expense records found
                      {dateFilter
                        ? ' for the selected date.'
                        : '.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!expensesLoading && filteredExpenses.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold text-gray-500">
              Showing{' '}
              <span className="font-black text-gray-800">
                {startRow}-{endRow}
              </span>{' '}
              of{' '}
              <span className="font-black text-gray-800">
                {filteredExpenses.length}
              </span>{' '}
              expense records · 10 per page
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.max(1, page - 1),
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
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1),
                  )
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  void refreshExpenses().catch(
                    (error) => {
                      setErrorMessage(
                        error instanceof Error
                          ? error.message
                          : 'Unable to refresh expenses.',
                      );
                    },
                  )
                }
                className="flex items-center gap-1.5 px-2 text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <DollarSign className="h-4 w-4 text-amber-600" />

                {editingExpenseId
                  ? 'Update Expense'
                  : 'Add New Expense'}
              </h3>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-xs font-bold">
                  Expense Name / Category *
                </label>

                <input
                  type="text"
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Electricity, Milk, Sugar"
                  required
                  disabled={isSaving}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold">
                  Amount ({settings.currency}) *
                </label>

                <input
                  type="number"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value,
                    )
                  }
                  required
                  min="0.01"
                  step="0.01"
                  disabled={isSaving}
                  placeholder="Enter expense amount"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold">
                  Expense Date *
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="date"
                    value={expenseDate}
                    max={getToday()}
                    onChange={(event) => {
                      const selectedDate =
                        event.target.value;

                      if (
                        selectedDate &&
                        selectedDate > getToday()
                      ) {
                        setExpenseDate(
                          getToday(),
                        );
                        setErrorMessage(
                          'Expense date cannot be a future date.',
                        );
                        return;
                      }

                      setErrorMessage('');
                      setExpenseDate(
                        selectedDate,
                      );
                    }}
                    required
                    disabled={isSaving}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold">
                  Notes / Description
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value,
                    )
                  }
                  rows={3}
                  disabled={isSaving}
                  placeholder="Enter expense details"
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    !category.trim() ||
                    !amount ||
                    Number(amount) <= 0 ||
                    !expenseDate
                  }
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-amber-950 hover:bg-amber-500 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      {editingExpenseId
                        ? 'Updating...'
                        : 'Saving...'}
                    </>
                  ) : (
                    <>
                      {editingExpenseId
                        ? 'Update Expense'
                        : 'Save Expense'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};