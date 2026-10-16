import { supabase } from '../lib/supabase';

import {
  CreateExpenseInput,
  Expense,
  UpdateExpenseInput,
} from '../types';

interface ExpenseDatabaseRow {
  id: string;
  category: string;
  amount: number | string;
  expense_date: string;
  notes: string | null;
  receipt_image: string | null;
  added_by_id: string | null;
  added_by_name: string;
  created_at: string;
  updated_at: string;
}

const mapExpense = (
  row: ExpenseDatabaseRow,
): Expense => ({
  id: row.id,
  category: row.category,
  amount: Number(row.amount ?? 0),
  date: row.expense_date,
  notes: row.notes ?? '',
  receiptImage:
    row.receipt_image ?? undefined,
  addedBy: row.added_by_name,
  addedById:
    row.added_by_id ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const expenseService = {
  async getAll(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', {
        ascending: false,
      })
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return (
      data as ExpenseDatabaseRow[]
    ).map(mapExpense);
  },

  async create(
    input: CreateExpenseInput,
  ): Promise<Expense> {
    if (!input.category.trim()) {
      throw new Error(
        'Expense category is required.',
      );
    }

    if (
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    ) {
      throw new Error(
        'Expense amount must be greater than zero.',
      );
    }

    if (!input.date) {
      throw new Error(
        'Expense date is required.',
      );
    }

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
      .from('expenses')
      .insert({
        category: input.category.trim(),
        amount: input.amount,
        expense_date: input.date,
        notes: input.notes?.trim() || null,
        receipt_image:
          input.receiptImage?.trim() || null,
        added_by_id: user.id,
        added_by_name:
          input.addedBy.trim() || 'Admin',
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapExpense(
      data as ExpenseDatabaseRow,
    );
  },

  async update(
    id: string,
    input: UpdateExpenseInput,
  ): Promise<Expense> {
    if (!input.category.trim()) {
      throw new Error(
        'Expense category is required.',
      );
    }

    if (
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    ) {
      throw new Error(
        'Expense amount must be greater than zero.',
      );
    }

    if (!input.date) {
      throw new Error(
        'Expense date is required.',
      );
    }

    const { data, error } = await supabase
      .from('expenses')
      .update({
        category: input.category.trim(),
        amount: input.amount,
        expense_date: input.date,
        notes: input.notes?.trim() || null,
        receipt_image:
          input.receiptImage?.trim() || null,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapExpense(
      data as ExpenseDatabaseRow,
    );
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },
};