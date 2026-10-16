import { supabase } from '../lib/supabase';
import {
  CreateEmployeeInput,
  CreateEmployeeResult,
  Employee,
  SetEmployeeStatusResult,
  UpdateEmployeeInput,
  UpdateEmployeeResult,
} from '../types';

interface StaffDatabaseRow {
  id: string;
  auth_user_id: string | null;
  user_type: 'Normal' | 'POS Access';
  full_name: string;
  email: string | null;
  phone: string;
  role: Employee['role'];
  photo: string;
  salary: number | string;
  date_of_birth: string;
  gender: Employee['gender'];
  working_type:
    Employee['workingType'];
  attendance: string;
  status: Employee['status'];
  permissions: string[] | null;
  created_at: string;
  updated_at: string;
}

const mapEmployee = (
  row: StaffDatabaseRow,
): Employee => ({
  id: row.id,
  authUserId:
    row.auth_user_id ?? undefined,
  userType: row.user_type,
  name: row.full_name,
  username: row.email ?? '',
  email: row.email ?? '',
  phone: row.phone ?? '',
  role: row.role,
  pin: '',
  photo: row.photo ?? '',
  salary: Number(row.salary ?? 0),
  dateOfBirth:
    row.date_of_birth ?? undefined,
  gender: row.gender,
  workingType: row.working_type,
  attendance:
    row.attendance ?? 'Present',
  status: row.status,
  permissions: row.permissions ?? [],
  createdAt: row.created_at,
  updatedAt:
    row.updated_at ?? undefined,
});

async function getFunctionError(
  error: unknown,
  fallback: string,
): Promise<string> {
  const functionError = error as {
    message?: string;
    context?: Response;
  };

  try {
    const response =
      await functionError.context?.json();

    if (response?.message) {
      return response.message;
    }
  } catch {
    // Use the default message.
  }

  return (
    functionError.message ||
    fallback
  );
}

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    const { data, error } =
      await supabase
        .from('staff_members')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      throw new Error(error.message);
    }

    return (
      data as StaffDatabaseRow[]
    ).map(mapEmployee);
  },

  async create(
    input: CreateEmployeeInput,
  ): Promise<CreateEmployeeResult> {
    const { data, error } =
      await supabase.functions.invoke(
        'create-staff-member',
        {
          body: input,
        },
      );

    if (error) {
      throw new Error(
        await getFunctionError(
          error,
          'Unable to create the staff member.',
        ),
      );
    }

    if (!data?.staff) {
      throw new Error(
        data?.message ||
          'The backend returned an invalid response.',
      );
    }

    return {
      employee: mapEmployee(
        data.staff as StaffDatabaseRow,
      ),
      emailSent:
        Boolean(data.emailSent),
      emailWarning:
        data.emailWarning,
    };
  },

  async update(
    employeeId: string,
    input: UpdateEmployeeInput,
  ): Promise<UpdateEmployeeResult> {
    const { data, error } =
      await supabase.functions.invoke(
        'manage-staff-member',
        {
          body: {
            action: 'update',
            employeeId,
            ...input,
          },
        },
      );

    if (error) {
      throw new Error(
        await getFunctionError(
          error,
          'Unable to update the staff member.',
        ),
      );
    }

    if (!data?.staff) {
      throw new Error(
        data?.message ||
          'The backend returned an invalid response.',
      );
    }

    return {
      employee: mapEmployee(
        data.staff as StaffDatabaseRow,
      ),
      emailSent:
        Boolean(data.emailSent),
      emailWarning:
        data.emailWarning,
    };
  },

  async setStatus(
    employeeId: string,
    status: Employee['status'],
  ): Promise<SetEmployeeStatusResult> {
    const { data, error } =
      await supabase.functions.invoke(
        'manage-staff-member',
        {
          body: {
            action: 'set-status',
            employeeId,
            status,
          },
        },
      );

    if (error) {
      throw new Error(
        await getFunctionError(
          error,
          'Unable to update staff status.',
        ),
      );
    }

    if (!data?.staff) {
      throw new Error(
        data?.message ||
          'The backend returned an invalid response.',
      );
    }

    return {
      employee: mapEmployee(
        data.staff as StaffDatabaseRow,
      ),
    };
  },
async updatePermissions(
  employeeId: string,
  permissions: string[],
): Promise<SetEmployeeStatusResult> {
  const { data, error } = await supabase
    .from('staff_members')
    .update({
      permissions,
      updated_at:
        new Date().toISOString(),
    })
    .eq('id', employeeId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'The employee was not found.',
    );
  }

  return {
    employee: mapEmployee(
      data as StaffDatabaseRow,
    ),
  };
},
};