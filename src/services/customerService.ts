import { supabase } from '../lib/supabase';
import { Customer } from '../types';

interface CustomerDatabaseRow {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  photo: string | null;

  wallet_balance: number | string;
  total_orders: number;
  total_spent: number | string;
  status:
    | 'Active'
    | 'Inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreateInput {
  name: string;
  mobile: string;
  email?: string;
  dob?: string;
  gender?: string;
  address?: string;
  photo?: string;


  status:
    | 'Active'
    | 'Inactive';

  notes?: string;
}

export interface CustomerUpdateInput {
  name?: string;
  mobile?: string;
  email?: string;
  dob?: string;
  gender?: string;
  address?: string;
  photo?: string;


  walletBalance?: number;
  totalOrders?: number;
  totalSpent?: number;

  status?:
    | 'Active'
    | 'Inactive';

  notes?: string;
}

const CUSTOMER_COLUMNS = `
  id,
  name,
  mobile,
  email,
  dob,
  gender,
  address,
  photo,
  wallet_balance,
  total_orders,
  total_spent,
  status,
  notes,
  created_at,
  updated_at
`;

const mapCustomerFromDatabase = (
  row: CustomerDatabaseRow
): Customer => {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    email: row.email || '',
    dob: row.dob || '',
    gender: row.gender || undefined,
    address: row.address || '',
    photo: row.photo || '',
    walletBalance:
      Number(row.wallet_balance),
    totalOrders: row.total_orders,
    totalSpent: Number(row.total_spent),
    status: row.status,
    notes: row.notes || '',
    createdAt:
      row.created_at.slice(0, 10),
    updatedAt: row.updated_at
  };
};

const cleanOptionalText = (
  value: string | undefined
): string | null => {
  const cleanedValue = value?.trim();

  return cleanedValue
    ? cleanedValue
    : null;
};

const customerError = (
  defaultMessage: string,
  errorMessage: string
): Error => {
  if (
    errorMessage.includes(
      'customers_mobile_key'
    )
  ) {
    return new Error(
      'This mobile number is already registered.'
    );
  }

  if (
    errorMessage.includes(
      'customers_email_unique_index'
    )
  ) {
    return new Error(
      'This email address is already registered.'
    );
  }

  if (
    errorMessage.includes(
      'row-level security'
    )
  ) {
    return new Error(
      'You do not have permission to perform this Customer action.'
    );
  }

  return new Error(
    `${defaultMessage}: ${errorMessage}`
  );
};

export const customerService = {
  // READ all Customers

  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select(CUSTOMER_COLUMNS)
      .order('created_at', {
        ascending: false
      });

    if (error) {
      throw customerError(
        'Unable to load Customers',
        error.message
      );
    }

    return (
      (data || []) as CustomerDatabaseRow[]
    ).map(mapCustomerFromDatabase);
  },

  // READ one Customer

  async getById(
    id: string
  ): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .select(CUSTOMER_COLUMNS)
      .eq('id', id)
      .single();

    if (error) {
      throw customerError(
        'Unable to load Customer',
        error.message
      );
    }

    return mapCustomerFromDatabase(
      data as CustomerDatabaseRow
    );
  },

  // CREATE Customer

  async create(
    input: CustomerCreateInput
  ): Promise<Customer> {
    const cleanName = input.name.trim();
    const cleanMobile =
      input.mobile.trim();

    if (cleanName.length < 2) {
      throw new Error(
        'Customer name must contain at least 2 characters.'
      );
    }

    if (cleanMobile.length < 7) {
      throw new Error(
        'Please enter a valid mobile number.'
      );
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: cleanName,
        mobile: cleanMobile,
        email:
          cleanOptionalText(input.email)
            ?.toLowerCase() || null,
        dob:
          cleanOptionalText(input.dob),
        gender:
          cleanOptionalText(input.gender),
        address:
          cleanOptionalText(input.address),
        photo:
          cleanOptionalText(input.photo),
       
        status: input.status,
        notes:
          cleanOptionalText(input.notes)
      })
      .select(CUSTOMER_COLUMNS)
      .single();

    if (error) {
      throw customerError(
        'Unable to create Customer',
        error.message
      );
    }

    return mapCustomerFromDatabase(
      data as CustomerDatabaseRow
    );
  },

  // UPDATE Customer

  async update(
    id: string,
    input: CustomerUpdateInput
  ): Promise<Customer> {
    const updateData: Record<
      string,
      string | number | null
    > = {};

    if (input.name !== undefined) {
      const cleanName =
        input.name.trim();

      if (cleanName.length < 2) {
        throw new Error(
          'Customer name must contain at least 2 characters.'
        );
      }

      updateData.name = cleanName;
    }

    if (input.mobile !== undefined) {
      const cleanMobile =
        input.mobile.trim();

      if (cleanMobile.length < 7) {
        throw new Error(
          'Please enter a valid mobile number.'
        );
      }

      updateData.mobile =
        cleanMobile;
    }

    if (input.email !== undefined) {
      updateData.email =
        cleanOptionalText(input.email)
          ?.toLowerCase() || null;
    }

    if (input.dob !== undefined) {
      updateData.dob =
        cleanOptionalText(input.dob);
    }

    if (input.gender !== undefined) {
      updateData.gender =
        cleanOptionalText(input.gender);
    }

    if (input.address !== undefined) {
      updateData.address =
        cleanOptionalText(input.address);
    }

    if (input.photo !== undefined) {
      updateData.photo =
        cleanOptionalText(input.photo);
    }

 
   
    if (
      input.walletBalance !== undefined
    ) {
      updateData.wallet_balance =
        input.walletBalance;
    }

    if (input.totalOrders !== undefined) {
      updateData.total_orders =
        input.totalOrders;
    }

    if (input.totalSpent !== undefined) {
      updateData.total_spent =
        input.totalSpent;
    }

    if (input.status !== undefined) {
      updateData.status =
        input.status;
    }

    if (input.notes !== undefined) {
      updateData.notes =
        cleanOptionalText(input.notes);
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select(CUSTOMER_COLUMNS)
      .single();

    if (error) {
      throw customerError(
        'Unable to update Customer',
        error.message
      );
    }

    return mapCustomerFromDatabase(
      data as CustomerDatabaseRow
    );
  },

  // DELETE Customer

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      throw customerError(
        'Unable to delete Customer',
        error.message
      );
    }
  }
};