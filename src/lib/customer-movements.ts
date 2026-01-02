import { supabase } from '@/integrations/supabase/client';

export interface CustomerBalanceMovement {
  id: string;
  customer_id: string;
  user_id: string;
  type: 'credit_sale' | 'payment' | 'adjustment_credit' | 'adjustment_debit';
  amount: number;
  balance_after: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export async function getCustomerMovements(customerId: string): Promise<CustomerBalanceMovement[]> {
  const { data, error } = await supabase
    .from('customer_balance_movements')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as CustomerBalanceMovement[] || [];
}

export async function createBalanceMovement(
  userId: string,
  customerId: string,
  type: CustomerBalanceMovement['type'],
  amount: number,
  balanceAfter: number,
  referenceId?: string,
  description?: string
): Promise<CustomerBalanceMovement> {
  const { data, error } = await supabase
    .from('customer_balance_movements')
    .insert({
      user_id: userId,
      customer_id: customerId,
      type,
      amount,
      balance_after: balanceAfter,
      reference_id: referenceId || null,
      description: description || null
    })
    .select()
    .single();

  if (error) throw error;
  return data as CustomerBalanceMovement;
}
