import React, { useEffect, useMemo, useState } from 'react';
import {
  UserCheck,
  Plus,
  X,
  Edit2,
  UserX,
  UserRoundCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CreateEmployeeInput,
  Employee,
  EmployeeUserType,
  UpdateEmployeeInput,
  UserRole,
} from '../../types';
import { ImageUploader } from '../common/ImageUploader';
import Swal from 'sweetalert2';

const AVAILABLE_SECTIONS: { id: string; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pos', label: 'POS Sales' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
  { id: 'products', label: 'Products' },
  { id: 'categories', label: 'Categories' },
  { id: 'offers', label: 'Offers' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'employees', label: 'Employees' },
  { id: 'salary', label: 'Salary Ledger' },
  { id: 'reports', label: 'Reports' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'settings', label: 'Settings' }
];

export const EmployeesView: React.FC = () => {
  const {
  employees,
  employeesLoading,
  addEmployee,
  updateEmployee,
  setEmployeeStatus,
} = useApp();

const [userType, setUserType] =
  useState<EmployeeUserType>('Normal');

const [password, setPassword] =
  useState('');

const [dateOfBirth, setDateOfBirth] =
  useState('');

const [isSaving, setIsSaving] =
  useState(false);

const [formError, setFormError] =
  useState('');

const [successMessage, setSuccessMessage] =
  useState('');

const [currentPage, setCurrentPage] =
  useState(1);

const PAGE_SIZE = 10;


  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [editingId, setEditingId] = useState<string | null>(null);

  const [editingId, setEditingId] =
  useState<string | null>(null);

const [originalEmail, setOriginalEmail] =
  useState('');

const [
  status,
  setStatus,
] = useState<
  'Active' | 'Inactive'
>('Active');

const [
  statusUpdatingId,
  setStatusUpdatingId,
] = useState<string | null>(null);

  const [name, setName] = useState('');
  // const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [dateOfBirthError, setDateOfBirthError] = useState('');
  const [role, setRole] = useState<UserRole>('Cashier');
  // const [pin, setPin] = useState('1234');
  const [photo, setPhoto] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [workingType, setWorkingType] = useState<'Full-time' | 'Part-time'>('Full-time');
  const [permissions, setPermissions] = useState<string[]>([]);

  const getLocalToday = (): string => {
    const today = new Date();

    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
  };

  const minimumBirthDate = '1900-01-01';
  const maximumBirthDate = getLocalToday();

  const normalizeSriLankanPhone = (
    value: string,
  ): string => {
    const digits = value.replace(/\D/g, '');

    if (/^94[7]\d{8}$/.test(digits)) {
      return `0${digits.slice(2)}`;
    }

    return digits.slice(0, 10);
  };

  const validatePhone = (
    value: string,
  ): string => {
    if (!value) {
      return 'Phone number is required.';
    }

    if (!/^0\d{9}$/.test(value)) {
      return 'Enter a valid Sri Lankan 10-digit number starting with 0, e.g. 0771234567.';
    }

    return '';
  };

  const validateDateOfBirth = (
    value: string,
  ): string => {
    if (!value) {
      return 'Date of birth is required.';
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return 'Enter a valid date of birth.';
    }

    if (value < minimumBirthDate) {
      return 'Date of birth cannot be before 01 Jan 1900.';
    }

    if (value > maximumBirthDate) {
      return 'Date of birth cannot be in the future.';
    }

    const parsed = new Date(`${value}T12:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return 'Enter a valid date of birth.';
    }

    return '';
  };

  const handleOpenAdd = () => {
  setEditingId(null);
  setOriginalEmail('');
  setStatus('Active');
  setUserType('Normal');
  setName('');
  setEmail('');
  setPassword('');
  setPhone('');
  setPhoneError('');
  setDateOfBirthError('');
  setRole('Worker');
  setPhoto(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  );
  setGender('Male');
  setWorkingType('Full-time');
  setDateOfBirth('');
  setPermissions([]);
  setFormError('');
  setSuccessMessage('');
  setIsModalOpen(true);
};

  const handleOpenEdit = (
  employee: Employee,
) => {
  setEditingId(employee.id);
  setUserType(employee.userType);
  setName(employee.name);
  setEmail(employee.email);
  setOriginalEmail(employee.email);
  setPassword('');
  setPhone(
    normalizeSriLankanPhone(
      employee.phone || '',
    ),
  );
  setPhoneError('');
  setDateOfBirthError('');
  setRole(employee.role);
  setPhoto(employee.photo);
  setGender(
    employee.gender ?? 'Male',
  );
  setWorkingType(
    employee.workingType ??
      'Full-time',
  );
  const existingDob =
    employee.dateOfBirth ?? '';

  setDateOfBirth(
    existingDob &&
    existingDob >= minimumBirthDate &&
    existingDob <= maximumBirthDate
      ? existingDob
      : '',
  );
  setPermissions(
    employee.permissions ?? [],
  );
  setStatus(employee.status);
  setFormError('');
  setSuccessMessage('');
  setIsModalOpen(true);
};

  const handleSave = async (
  event: React.FormEvent,
) => {
  event.preventDefault();

  setFormError('');
  setSuccessMessage('');

  if (!name.trim()) {
    setFormError(
      'Full name is required.',
    );
    return;
  }

  const normalizedPhone =
    normalizeSriLankanPhone(phone);

  const currentPhoneError =
    validatePhone(normalizedPhone);

  const currentDobError =
    validateDateOfBirth(dateOfBirth);

  setPhone(normalizedPhone);
  setPhoneError(currentPhoneError);
  setDateOfBirthError(currentDobError);

  if (
    currentPhoneError ||
    currentDobError
  ) {
    setFormError(
      'Please correct the highlighted fields before saving.',
    );
    return;
  }

  if (
    userType === 'POS Access' &&
    !email.trim()
  ) {
    setFormError(
      'Email is required for POS Access.',
    );
    return;
  }

  const emailChanged =
    editingId !== null &&
    userType === 'POS Access' &&
    email.trim().toLowerCase() !==
      originalEmail
        .trim()
        .toLowerCase();

  if (
    emailChanged &&
    password.length < 8
  ) {
    setFormError(
      'Enter a new temporary password when changing the login email.',
    );
    return;
  }

  if (
    password &&
    password.length < 8
  ) {
    setFormError(
      'Password must contain at least 8 characters.',
    );
    return;
  }

  try {
    setIsSaving(true);

    if (editingId) {
      const updateData:
        UpdateEmployeeInput = {
          name: name.trim(),
          phone: normalizedPhone,
          role,
          photo,
          salary: 0,
          dateOfBirth,
          gender,
          workingType,
          permissions:
            userType === 'POS Access'
              ? permissions
              : [],
          status,
        };

      if (
        userType === 'POS Access'
      ) {
        updateData.email =
          email
            .trim()
            .toLowerCase();

        if (password) {
          updateData.newPassword =
            password;
        }
      }

      const result =
        await updateEmployee(
          editingId,
          updateData,
        );

      if (result.emailSent) {
        setSuccessMessage(
          'Staff updated and new login details emailed successfully.',
        );
      } else if (
        result.emailWarning
      ) {
        setSuccessMessage(
          `Staff updated. ${result.emailWarning}`,
        );
      } else {
        setSuccessMessage(
          'Staff member updated successfully.',
        );

        await Swal.fire({
          icon: 'success',
          title: 'Staff updated!',
          text: `${name.trim()} was updated successfully.`,
          timer: 1600,
          showConfirmButton: false,
        });
      }
    } else {
      const createData:
        CreateEmployeeInput = {
          userType,
          name: name.trim(),
          phone: normalizedPhone,
          role,
          photo,
          salary: 0,
          dateOfBirth,
          gender,
          workingType,
          permissions:
            userType === 'POS Access'
              ? permissions
              : [],
        };

      if (
        userType === 'POS Access'
      ) {
        if (password.length < 8) {
          setFormError(
            'Password must contain at least 8 characters.',
          );
          return;
        }

        createData.email =
          email
            .trim()
            .toLowerCase();

        createData.password =
          password;
      }

      await addEmployee(createData);

      setSuccessMessage(
        'Staff member created successfully.',
      );

      await Swal.fire({
        icon: 'success',
        title: 'Staff created!',
        text: `${name.trim()} was created successfully.`,
        timer: 1600,
        showConfirmButton: false,
      });
    }

    window.setTimeout(() => {
      setIsModalOpen(false);
      setSuccessMessage('');
    }, 1500);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to save the staff member.';

    setFormError(message);

    await Swal.fire({
      icon: 'error',
      title: 'Unable to save staff',
      text: message,
      confirmButtonColor: '#d97706',
    });
  } finally {
    setIsSaving(false);
  }
};

const handleStatusChange = async (
  employee: Employee,
) => {
  const nextStatus =
    employee.status === 'Active'
      ? 'Inactive'
      : 'Active';

  const confirmation = await Swal.fire({
    icon: 'warning',
    title:
      nextStatus === 'Inactive'
        ? 'Deactivate staff account?'
        : 'Reactivate staff account?',
    text:
      nextStatus === 'Inactive'
        ? `${employee.name} will no longer be able to use the account.`
        : `${employee.name}'s account will become active again.`,
    showCancelButton: true,
    confirmButtonText:
      nextStatus === 'Inactive'
        ? 'Yes, deactivate'
        : 'Yes, reactivate',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true,
    confirmButtonColor:
      nextStatus === 'Inactive'
        ? '#dc2626'
        : '#16a34a',
    cancelButtonColor: '#6b7280',
  });

  if (!confirmation.isConfirmed) return;

  try {
    setStatusUpdatingId(employee.id);

    await setEmployeeStatus(
      employee.id,
      nextStatus,
    );

    await Swal.fire({
      icon: 'success',
      title:
        nextStatus === 'Inactive'
          ? 'Account deactivated'
          : 'Account reactivated',
      text: `${employee.name} was updated successfully.`,
      timer: 1600,
      showConfirmButton: false,
    });
  } catch (error) {
    await Swal.fire({
      icon: 'error',
      title: 'Unable to update staff status',
      text:
        error instanceof Error
          ? error.message
          : 'Unable to update staff status.',
      confirmButtonColor: '#d97706',
    });
  } finally {
    setStatusUpdatingId(null);
  }
};

  const paginatedEmployees = useMemo(() => {
    const start =
      (currentPage - 1) * PAGE_SIZE;

    return employees.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [employees, currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(employees.length / PAGE_SIZE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startRow =
    employees.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endRow = Math.min(
    currentPage * PAGE_SIZE,
    employees.length,
  );

  return (
    <div className="p-6 space-y-6 bg-[#FAF7F2] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 font-serif flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-600" /> Employee & Staff Management
          </h1>
          <p className="text-xs text-gray-500">Manage cashier credentials, 4-digit PIN authentication, salaries and access roles</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Photo</th>
                <th className="py-3 px-3">Staff Name</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Username</th>
                <th className="py-3 px-3">
  User Type
</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Gender</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {employeesLoading && (
  <tr>
    <td
      colSpan={9}
      className="py-10 text-center text-gray-500"
    >
      Loading staff members...
    </td>
  </tr>
)}

{!employeesLoading &&
  employees.length === 0 && (
    <tr>
      <td
        colSpan={9}
        className="py-10 text-center text-gray-500"
      >
        No staff members have been added.
      </td>
    </tr>
  )}
              {!employeesLoading &&
  paginatedEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="py-3 px-3">
                    <img src={emp.photo} alt={emp.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-300" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-gray-900">{emp.name}</div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase">{emp.workingType || 'Full-time'}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      emp.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {emp.role}
                    </span>
                  </td>
                 <td className="py-3 px-3 text-gray-700">
  {emp.userType === 'POS Access'
    ? emp.email
    : 'No POS access'}
</td>
                  <td className="py-3 px-3">
  <span
    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
      emp.userType === 'POS Access'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-700'
    }`}
  >
    {emp.userType}
  </span>
</td>
                  <td className="py-3 px-3 text-gray-600">
                    <div>{emp.phone}</div>
                    <div className="text-[10px] text-gray-400">{emp.email}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-gray-700">{emp.gender || '-'}</td>
                  <td className="py-3 px-3">
                   <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                 <td className="py-3 px-3 text-right">
  <div className="flex items-center justify-end gap-1">
    <button
      type="button"
      onClick={() =>
        handleOpenEdit(emp)
      }
      title="Edit staff member"
      className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
    >
      <Edit2 className="w-4 h-4" />
    </button>

    <button
      type="button"
      onClick={() =>
        void handleStatusChange(emp)
      }
      disabled={
        statusUpdatingId === emp.id
      }
      title={
        emp.status === 'Active'
          ? 'Deactivate account'
          : 'Reactivate account'
      }
      className={`p-1.5 rounded-lg disabled:opacity-50 ${
        emp.status === 'Active'
          ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
          : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
      }`}
    >
      {emp.status === 'Active' ? (
        <UserX className="w-4 h-4" />
      ) : (
        <UserRoundCheck className="w-4 h-4" />
      )}
    </button>
  </div>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!employeesLoading && employees.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold text-gray-500">
              Showing{' '}
              <span className="font-black text-gray-800">
                {startRow}-{endRow}
              </span>{' '}
              of{' '}
              <span className="font-black text-gray-800">
                {employees.length}
              </span>{' '}
              staff · 10 per page
            </p>

            <div className="flex items-center gap-2">
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
                disabled={
                  currentPage === totalPages
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-bold text-sm">
  {editingId
  ? 'Edit Staff Member'
  : 'Add Staff Member'}
</h3>
              <button
  type="button"
  onClick={() => {
    if (!isSaving) {
      setIsModalOpen(false);
    }
  }}
  disabled={isSaving}
  aria-label="Close modal"
  className="shrink-0 p-2 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
>
  <X className="w-5 h-5" />
</button>
            </div>
            <form onSubmit={handleSave} className="space-y-3 overflow-y-auto pr-1 flex-1">
              <ImageUploader value={photo} onChange={setPhoto} label="Staff Photo" aspectRatio="avatar" />
              <div>
  <label className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed">
    User Type *
  </label>

  <select
    value={userType}
    disabled={editingId !== null}
    onChange={(event) => {
      const selectedType =
        event.target.value as EmployeeUserType;

      setUserType(selectedType);

      if (selectedType === 'Normal') {
        setEmail('');
        setPassword('');
        setPermissions([]);
      } else {
        setRole('Cashier');
        setPermissions([
          'pos',
          'orders',
          'customers',
        ]);
      }
    }}
    required
    className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
  >
    <option value="Normal">
      Normal Staff
    </option>

    <option value="POS Access">
      POS Access
    </option>
  </select>
{editingId && (
  <p className="mt-1 text-[10px] text-gray-500">
    User type cannot be changed after account creation.
  </p>
)}
  <p className="mt-1 text-[10px] text-gray-500">
    {userType === 'Normal'
      ? 'This employee will not receive a POS login account.'
      : 'This employee can sign in to the POS using email and password.'}
  </p>
</div>
              <div>
                <label className="text-xs font-bold block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full p-2 bg-gray-50 border rounded-xl text-xs"
                />
              </div>
              <div>
  <label className="text-xs font-bold block mb-1">
    Date of Birth *
  </label>
  <p className="mb-1 text-[9px] text-gray-400">
    Select a real date between 01 Jan 1900 and today.
  </p>

  <input
    type="date"
    value={dateOfBirth}
    min={minimumBirthDate}
    max={maximumBirthDate}
    required
    onChange={(event) => {
      const value = event.target.value;

      if (!value) {
        setDateOfBirth('');
        setDateOfBirthError(
          'Date of birth is required.',
        );
        return;
      }

      if (value > maximumBirthDate) {
        setDateOfBirth('');
        setDateOfBirthError(
          'Date of birth cannot be in the future.',
        );
        return;
      }

      if (value < minimumBirthDate) {
        setDateOfBirth('');
        setDateOfBirthError(
          'Date of birth cannot be before 01 Jan 1900.',
        );
        return;
      }

      setDateOfBirth(value);
      setDateOfBirthError(
        validateDateOfBirth(value),
      );
    }}
    onBlur={() =>
      setDateOfBirthError(
        validateDateOfBirth(dateOfBirth),
      )
    }
    aria-invalid={Boolean(
      dateOfBirthError,
    )}
    aria-describedby="employee-dob-error"
    className={`w-full p-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:ring-1 ${
      dateOfBirthError
        ? 'border-red-400 focus:ring-red-300'
        : 'border-gray-200 focus:ring-amber-400'
    }`}
  />

  {dateOfBirthError && (
    <p
      id="employee-dob-error"
      className="mt-1 text-[10px] font-semibold text-red-600"
    >
      {dateOfBirthError}
    </p>
  )}
</div>
              <div>
  <label className="text-xs font-bold block mb-1">
    Staff Role *
  </label>

  <select
    value={role}
    onChange={(event) =>
      setRole(
        event.target.value as UserRole,
      )
    }
    required
    className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
  >
    <option value="Admin">Admin</option>
    <option value="Cashier">Cashier</option>
    <option value="Manager">Manager</option>
    <option value="Delivery Boy">
      Delivery Boy
    </option>
    <option value="Tea Master">
      Tea Master
    </option>
    <option value="Worker">Worker</option>
  </select>
</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold block mb-1">
                    Phone Number *
                  </label>
                  <p className="mb-1 text-[9px] text-gray-400">
                    Sri Lanka format: 10 digits, e.g. 0771234567.
                  </p>
                 <input
  type="tel"
  inputMode="numeric"
  autoComplete="tel"
  value={phone}
  maxLength={10}
  pattern="0[0-9]{9}"
  onChange={(event) => {
    const normalized =
      normalizeSriLankanPhone(
        event.target.value,
      );

    setPhone(normalized);

    if (phoneError) {
      setPhoneError(
        validatePhone(normalized),
      );
    }
  }}
  onBlur={() =>
    setPhoneError(
      validatePhone(phone),
    )
  }
  required
  placeholder="0771234567"
  aria-invalid={Boolean(phoneError)}
  aria-describedby="employee-phone-error"
  className={`w-full p-2 bg-gray-50 border rounded-xl text-xs focus:outline-none focus:ring-1 ${
    phoneError
      ? 'border-red-400 focus:ring-red-300'
      : 'border-gray-200 focus:ring-amber-400'
  }`}
/>

{phoneError && (
  <p
    id="employee-phone-error"
    className="mt-1 text-[10px] font-semibold text-red-600"
  >
    {phoneError}
  </p>
)}
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(event) =>
  setGender(
    event.target.value as
      | 'Male'
      | 'Female'
      | 'Other',
  )
}
                    required
                    className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Working Type *</label>
                <select
                  value={workingType}
                 onChange={(event) =>
  setWorkingType(
    event.target.value as
      | 'Full-time'
      | 'Part-time',
  )
}
                  required
                  className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>
              {editingId && (
  <div>
    <label className="text-xs font-bold block mb-1">
      Account Status *
    </label>

    <select
      value={status}
      onChange={(event) =>
        setStatus(
          event.target.value as
            | 'Active'
            | 'Inactive',
        )
      }
      className="w-full p-2 bg-gray-50 border rounded-xl text-xs font-bold"
    >
      <option value="Active">
        Active
      </option>

      <option value="Inactive">
        Inactive
      </option>
    </select>
  </div>
)}
                  {userType === 'POS Access' && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    <div>
      <label className="text-xs font-bold block mb-1">
        Login Email *
      </label>

      <input
        type="email"
        value={email}
        onChange={(event) =>
          setEmail(event.target.value)
        }
        required
        autoComplete="off"
        placeholder="staff@example.com"
        className="w-full p-2 bg-gray-50 border rounded-xl text-xs"
      />
    </div>

    <div>
      <label className="text-xs font-bold block mb-1">
  {editingId
    ? 'New Temporary Password'
    : 'Temporary Password *'}
</label>

      <input
      
        type="password"
        value={password}
        onChange={(event) =>
          setPassword(event.target.value)
        }
        required={!editingId}
        minLength={8}
        autoComplete="new-password"
        placeholder={
        editingId
          ? 'Leave blank to keep current password'
          : 'Minimum 8 characters'
      }
        className="w-full p-2 bg-gray-50 border rounded-xl text-xs"
      />
      {editingId && (
  <p className="mt-1 text-[10px] text-gray-500">
    Required only when changing the login email or resetting the password.
  </p>
)}
    </div>
  </div>
)}
              
            {formError && (
  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
    {formError}
  </div>
)}

{successMessage && (
  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
    {successMessage}
  </div>
)}
              <div className="sticky bottom-0 -mx-1 mt-4 flex gap-2 border-t border-gray-100 bg-white pt-3 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!isSaving) {
                      setIsModalOpen(false);
                      setFormError('');
                      setSuccessMessage('');
                      setPhoneError('');
                      setDateOfBirthError('');
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-300 disabled:text-gray-500 text-amber-950 font-bold text-xs rounded-xl transition-colors"
                >
                  {isSaving
                    ? editingId
                      ? 'Updating...'
                      : 'Creating...'
                    : editingId
                      ? 'Save Changes'
                      : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};