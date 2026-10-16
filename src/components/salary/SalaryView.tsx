import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Wallet,
  Trash2,
  Calendar,
  Search,
  UserCheck,
  Banknote,
  Check,
  Loader2,
  AlertCircle,
  CircleCheckBig,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import Swal from 'sweetalert2';
import { useApp } from '../../context/AppContext';

export const SalaryView: React.FC = () => {
  const {
    employees,
    employeesLoading,
    refreshEmployees,
    salaries,
    salariesLoading,
    refreshSalaries,
    addSalary,
    updateSalary,
    deleteSalary,
    settings,
  } = useApp();

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState('');

  const [amount, setAmount] =
    useState<string>('');

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

    const [editingSalaryId, setEditingSalaryId] =
  useState<string | null>(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const PAGE_SIZE = 10;

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) =>
          employee.id === selectedEmployeeId,
      ) ?? null,
    [employees, selectedEmployeeId],
  );

  const activeEmployees = useMemo(
    () =>
      employees
        .filter(
          (employee) =>
            employee.status === 'Active',
        )
        .sort((first, second) =>
          first.name.localeCompare(second.name),
        ),
    [employees],
  );

  useEffect(() => {
    if (employees.length === 0) {
      void refreshEmployees().catch(
        (error) => {
          console.error(error);
        },
      );
    }
  }, []);

  useEffect(() => {
    if (!selectedEmployee) {
      setAmount('');
      return;
    }

    setAmount(
      selectedEmployee.salary > 0
        ? String(selectedEmployee.salary)
        : '',
    );
  }, [selectedEmployee]);

  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage('');
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const handleEditSalary = (
  salaryId: string,
) => {
  const salaryRecord = salaries.find(
    (salary) => salary.id === salaryId,
  );

  if (!salaryRecord) {
    setErrorMessage(
      'The selected salary record was not found.',
    );
    return;
  }

  setEditingSalaryId(salaryRecord.id);
  setSelectedEmployeeId(
    salaryRecord.employeeId,
  );
  setAmount(String(salaryRecord.amount));
  setDate(salaryRecord.date);
  setNotes(salaryRecord.notes ?? '');

  setErrorMessage('');
  setSuccessMessage('');

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

const cancelEditing = () => {
  setEditingSalaryId(null);
  setSelectedEmployeeId('');
  setAmount('');
  setDate(
    new Date().toISOString().slice(0, 10),
  );
  setNotes('');
  setErrorMessage('');
};

  const handlePaySalary = async (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  setErrorMessage('');
  setSuccessMessage('');

  if (!selectedEmployee) {
    setErrorMessage(
      'Please select an employee.',
    );
    return;
  }

  const numericAmount = Number(amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    setErrorMessage(
      'Please enter a valid salary amount.',
    );
    return;
  }

  if (!date) {
    setErrorMessage(
      'Please select the disbursement date.',
    );
    return;
  }

  setIsSaving(true);

  try {
    if (editingSalaryId) {
      await updateSalary(editingSalaryId, {
        amount: numericAmount,
        date,
        notes:
          notes.trim() ||
          'Monthly Salary Payment',
      });

      setSuccessMessage(
        `The salary payment for ${selectedEmployee.name} was updated successfully.`,
      );

      await Swal.fire({
        icon: 'success',
        title: 'Salary updated!',
        text: `${selectedEmployee.name}'s salary payment was updated successfully.`,
        timer: 1600,
        showConfirmButton: false,
      });
    } else {
      await addSalary({
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        amount: numericAmount,
        date,
        notes:
          notes.trim() ||
          'Monthly Salary Payment',
      });

      setSuccessMessage(
        `The salary payment for ${selectedEmployee.name} was saved successfully.`,
      );

      await Swal.fire({
        icon: 'success',
        title: 'Salary saved!',
        text: `${selectedEmployee.name}'s salary payment was saved successfully.`,
        timer: 1600,
        showConfirmButton: false,
      });
    }

    setEditingSalaryId(null);
    setSelectedEmployeeId('');
    setAmount('');
    setDate(
      new Date().toISOString().slice(0, 10),
    );
    setNotes('');
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : editingSalaryId
          ? 'Unable to update salary payment.'
          : 'Unable to save salary payment.';

    setErrorMessage(message);

    await Swal.fire({
      icon: 'error',
      title: editingSalaryId
        ? 'Update failed'
        : 'Save failed',
      text: message,
      confirmButtonColor: '#d97706',
    });
  } finally {
    setIsSaving(false);
  }
};

  const handleDelete = async (
    salaryId: string,
    employeeName: string,
  ) => {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'Delete salary record?',
      text: `This will permanently delete ${employeeName}'s salary payment record.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (!confirmation.isConfirmed) return;

    setErrorMessage('');
    setSuccessMessage('');
    setDeletingId(salaryId);

    try {
      await deleteSalary(salaryId);

      setSuccessMessage(
        'Salary payment record was deleted.',
      );

      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: `${employeeName}'s salary payment record was deleted successfully.`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to delete salary payment.';

      setErrorMessage(message);

      await Swal.fire({
        icon: 'error',
        title: 'Delete failed',
        text: message,
        confirmButtonColor: '#d97706',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSalaries = useMemo(() => {
    const cleanSearch =
      search.trim().toLowerCase();

    return salaries.filter((salary) => {
      const matchesSearch =
        !cleanSearch ||
        salary.employeeName
          .toLowerCase()
          .includes(cleanSearch) ||
        salary.notes
          ?.toLowerCase()
          .includes(cleanSearch);

      const matchesDate =
        !dateFilter ||
        salary.date === dateFilter;

      return matchesSearch && matchesDate;
    });
  }, [salaries, search, dateFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSalaries.length / PAGE_SIZE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedSalaries = useMemo(() => {
    const start =
      (currentPage - 1) * PAGE_SIZE;

    return filteredSalaries.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [filteredSalaries, currentPage]);

  const startRow =
    filteredSalaries.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endRow = Math.min(
    currentPage * PAGE_SIZE,
    filteredSalaries.length,
  );

  return (
    <div className="p-6 space-y-6 bg-[#FAF7F2] min-h-screen">
      <div>
        <h1 className="text-xl font-black text-gray-900 font-serif flex items-center gap-2">
          <Wallet className="w-6 h-6 text-amber-600" />
          Staff Salary Ledger
        </h1>

        <p className="text-xs text-gray-500">
          Record monthly salary disbursements,
          staff advance payments, and view
          transaction history
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-fit space-y-4">
          <h2 className="font-extrabold text-sm text-gray-900 font-serif flex items-center gap-1.5 pb-2 border-b border-gray-100">
            <Banknote className="w-4 h-4 text-emerald-600" />
           {editingSalaryId
  ? 'Update Salary Payment'
  : 'Record Salary Payment'}
          </h2>

          <form
            onSubmit={handlePaySalary}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-bold block mb-1 text-gray-700">
                Select Employee *
              </label>

              <select
                value={selectedEmployeeId}
                onChange={(event) =>
                  setSelectedEmployeeId(
                    event.target.value,
                  )
                }
                required
                disabled={
                    employeesLoading ||
                    isSaving ||
                    Boolean(editingSalaryId)
                  }
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
              >
                <option value="">
                  {employeesLoading
                    ? 'Loading employees...'
                    : 'Choose an employee...'}
                </option>

                {activeEmployees.map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name} ({employee.role})
                  </option>
                ))}
              </select>
            </div>

            {selectedEmployee && (
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-xs">
                <div>
                  <p className="text-gray-400">
                    Employee
                  </p>
                  <p className="font-bold text-gray-800">
                    {selectedEmployee.name}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400">
                    Role
                  </p>
                  <p className="font-bold text-gray-800">
                    {selectedEmployee.role}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400">
                    Phone
                  </p>
                  <p className="font-bold text-gray-800">
                    {selectedEmployee.phone || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400">
                    Registered salary
                  </p>
                  <p className="font-bold text-emerald-700">
                    {settings.currency}{' '}
                    {selectedEmployee.salary.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold block mb-1 text-gray-700">
                Salary Paid Amount ({settings.currency}) *
              </label>

              <input
                type="number"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                required
                min="1"
                step="0.01"
                disabled={!selectedEmployee || isSaving}
                placeholder="Enter payment amount"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1 text-gray-700">
                Disbursement Date *
              </label>

              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                required
                disabled={isSaving}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-700 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1 text-gray-700">
                Payment Notes / Reference
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="e.g. August 2026 Monthly Salary"
                rows={3}
                disabled={isSaving}
                className="w-full resize-none p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
              />
            </div>

            <div className="flex gap-2">
  {editingSalaryId && (
    <button
      type="button"
      onClick={cancelEditing}
      disabled={isSaving}
      className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
    >
      <X className="w-4 h-4" />
      Cancel
    </button>
  )}

  <button
    type="submit"
    disabled={
      !selectedEmployee ||
      !amount ||
      Number(amount) <= 0 ||
      isSaving
    }
    className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-amber-950 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
  >
    {isSaving ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />

        {editingSalaryId
          ? 'Updating...'
          : 'Saving...'}
      </>
    ) : (
      <>
        <Check className="w-4 h-4" />

        {editingSalaryId
          ? 'Update Record'
          : 'Save Record'}
      </>
    )}
  </button>
</div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
            <h2 className="font-extrabold text-sm text-gray-900 font-serif flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              Payment History Log
            </h2>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value)
                }
                className="p-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
              />

              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold"
                >
                  Clear
                </button>
              )}

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search employee or notes..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {salariesLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-xs font-semibold text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
              Loading payment history...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">
                      Employee Name
                    </th>
                    <th className="py-2.5 px-3">
                      Disbursement Date
                    </th>
                    <th className="py-2.5 px-3">
                      Amount Paid
                    </th>
                    <th className="py-2.5 px-3">
                      Reference / Notes
                    </th>
                    <th className="py-2.5 px-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50 font-medium">
                  {paginatedSalaries.map(
                    (salary) => (
                      <tr
                        key={salary.id}
                        className="hover:bg-amber-50/30 transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-700">
                              <UserCheck className="w-4 h-4" />
                            </div>

                            <span className="font-bold text-gray-900">
                              {salary.employeeName}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-gray-600">
                          {salary.date}
                        </td>

                        <td className="py-2.5 px-3 font-extrabold text-emerald-700 font-mono whitespace-nowrap">
                          {settings.currency}{' '}
                          {salary.amount.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </td>

                        <td
                          className="py-2.5 px-3 text-gray-500 max-w-50 truncate"
                          title={salary.notes}
                        >
                          {salary.notes || '—'}
                        </td>

                        <td className="py-2.5 px-3">
  <div className="flex items-center justify-end gap-1">
    <button
      type="button"
      onClick={() =>
        handleEditSalary(salary.id)
      }
      disabled={
        isSaving ||
        deletingId === salary.id
      }
      className="p-1.5 text-gray-400 hover:text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50"
      title="Edit salary record"
    >
      <Pencil className="w-4 h-4" />
    </button>

    <button
      type="button"
      disabled={
        deletingId === salary.id ||
        isSaving
      }
      onClick={() =>
        void handleDelete(
          salary.id,
          salary.employeeName,
        )
      }
      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
      title="Delete salary record"
    >
      {deletingId === salary.id ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  </div>
</td>
                      </tr>
                    ),
                  )}

                  {filteredSalaries.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-12 text-gray-400"
                      >
                        No salary payment history found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!salariesLoading && filteredSalaries.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-semibold text-gray-500">
                Showing{' '}
                <span className="font-black text-gray-800">
                  {startRow}-{endRow}
                </span>{' '}
                of{' '}
                <span className="font-black text-gray-800">
                  {filteredSalaries.length}
                </span>{' '}
                salary records · 10 per page
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
                      Math.min(
                        totalPages,
                        page + 1,
                      ),
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
                    void refreshSalaries().catch(
                      async (error) => {
                        const message =
                          error instanceof Error
                            ? error.message
                            : 'Unable to refresh history.';

                        setErrorMessage(message);

                        await Swal.fire({
                          icon: 'error',
                          title: 'Refresh failed',
                          text: message,
                          confirmButtonColor: '#d97706',
                        });
                      },
                    )
                  }
                  className="font-bold text-amber-700 hover:text-amber-800"
                >
                  Refresh history
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};