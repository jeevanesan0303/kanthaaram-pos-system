import { supabase } from '../lib/supabase';
import {
  CreateSalaryInput,
  SalaryRecord,
  UpdateSalaryInput,
} from '../types';

interface SalaryDatabaseRow {
  id: string;
  employee_id: string;
  employee_name: string;
  amount: number | string;
  payment_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

const mapSalaryRecord = (
  row: SalaryDatabaseRow,
): SalaryRecord => ({
  id: row.id,
  employeeId: row.employee_id,
  employeeName: row.employee_name,
  amount: Number(row.amount ?? 0),
  date: row.payment_date,
  notes: row.notes ?? undefined,
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at,
});

export const salaryService = {
  async getAll(): Promise<SalaryRecord[]> {
    const { data, error } = await supabase
      .from('salary_payments')
      .select('*')
      .order('payment_date', {
        ascending: false,
      })
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return (data as SalaryDatabaseRow[]).map(
      mapSalaryRecord,
    );
  },

  async create(
    input: CreateSalaryInput,
  ): Promise<SalaryRecord> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!user) {
      throw new Error(
        'Your login session has expired. Please log in again.',
      );
    }

    const { data, error } = await supabase
      .from('salary_payments')
      .insert({
        employee_id: input.employeeId,
        employee_name: input.employeeName.trim(),
        amount: input.amount,
        payment_date: input.date,
        notes: input.notes?.trim() || null,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapSalaryRecord(
      data as SalaryDatabaseRow,
    );
  },

  async update(
  id: string,
  input: UpdateSalaryInput,
): Promise<SalaryRecord> {
  if (!id) {
    throw new Error(
      'Salary payment ID is required.',
    );
  }

  if (
    !Number.isFinite(input.amount) ||
    input.amount <= 0
  ) {
    throw new Error(
      'Salary amount must be greater than zero.',
    );
  }

  if (!input.date) {
    throw new Error(
      'Payment date is required.',
    );
  }

  const { data, error } = await supabase
    .from('salary_payments')
    .update({
      amount: input.amount,
      payment_date: input.date,
      notes: input.notes?.trim() || null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSalaryRecord(
    data as SalaryDatabaseRow,
  );
},

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('salary_payments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },
};