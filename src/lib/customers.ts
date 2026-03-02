import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerWithSales extends Customer {
  total_purchases: number;
  last_purchase_date: string | null;
}

export async function getCustomers(userId: string, branchId?: string): Promise<Customer[]> {
  let query = supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error) throw error;
  return data;
}

export async function createCustomer(
  userId: string,
  customer: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  branchId?: string
): Promise<Customer> {
  const insertData: any = {
    user_id: userId,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    notes: customer.notes,
    balance: customer.balance
  };
  if (branchId) insertData.branch_id = branchId;

  const { data, error } = await supabase
    .from('customers')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCustomer(
  customerId: string,
  updates: Partial<Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (error) throw error;
}

export async function updateCustomerBalance(
  customerId: string,
  amount: number
): Promise<Customer> {
  const customer = await getCustomerById(customerId);
  if (!customer) throw new Error('Customer not found');

  const newBalance = customer.balance + amount;
  return updateCustomer(customerId, { balance: newBalance });
}

export async function getCustomerSales(customerId: string) {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
