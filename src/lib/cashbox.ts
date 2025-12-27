import { supabase } from '@/integrations/supabase/client';

export interface CashboxSession {
  id: string;
  user_id: string;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  opened_at: string;
  closed_at: string | null;
  status: 'open' | 'closed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashboxMovement {
  id: string;
  session_id: string;
  user_id: string;
  type: 'income' | 'expense' | 'sale' | 'refund' | 'adjustment';
  amount: number;
  description: string;
  payment_method: 'cash' | 'card' | 'transfer' | 'yape' | 'plin' | 'other' | null;
  reference_id: string | null;
  created_at: string;
}

export async function getActiveSession(userId: string): Promise<CashboxSession | null> {
  const { data, error } = await supabase
    .from('cashbox_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .maybeSingle();

  if (error) throw error;
  return data as CashboxSession | null;
}

export async function openSession(userId: string, openingAmount: number): Promise<CashboxSession> {
  const { data, error } = await supabase
    .from('cashbox_sessions')
    .insert({
      user_id: userId,
      opening_amount: openingAmount,
      status: 'open'
    })
    .select()
    .single();

  if (error) throw error;
  return data as CashboxSession;
}

export async function closeSession(
  sessionId: string,
  closingAmount: number,
  expectedAmount: number,
  notes?: string
): Promise<CashboxSession> {
  const difference = closingAmount - expectedAmount;

  const { data, error } = await supabase
    .from('cashbox_sessions')
    .update({
      closing_amount: closingAmount,
      expected_amount: expectedAmount,
      difference: difference,
      closed_at: new Date().toISOString(),
      status: 'closed',
      notes: notes || null
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data as CashboxSession;
}

export async function getSessionMovements(sessionId: string): Promise<CashboxMovement[]> {
  const { data, error } = await supabase
    .from('cashbox_movements')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as CashboxMovement[];
}

export async function addMovement(
  sessionId: string,
  userId: string,
  type: CashboxMovement['type'],
  amount: number,
  description: string,
  paymentMethod?: CashboxMovement['payment_method'],
  referenceId?: string
): Promise<CashboxMovement> {
  const { data, error } = await supabase
    .from('cashbox_movements')
    .insert({
      session_id: sessionId,
      user_id: userId,
      type,
      amount,
      description,
      payment_method: paymentMethod || null,
      reference_id: referenceId || null
    })
    .select()
    .single();

  if (error) throw error;
  return data as CashboxMovement;
}

export async function getSessionHistory(userId: string, limit = 10): Promise<CashboxSession[]> {
  const { data, error } = await supabase
    .from('cashbox_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('opened_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as CashboxSession[];
}

export function calculateSessionTotals(movements: CashboxMovement[], openingAmount: number) {
  const cashIncome = movements
    .filter(m => (m.type === 'income' || m.type === 'sale') && m.payment_method === 'cash')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const cashExpense = movements
    .filter(m => (m.type === 'expense' || m.type === 'refund') && m.payment_method === 'cash')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const totalSales = movements
    .filter(m => m.type === 'sale')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const totalIncome = movements
    .filter(m => m.type === 'income')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const totalExpenses = movements
    .filter(m => m.type === 'expense')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const totalRefunds = movements
    .filter(m => m.type === 'refund')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const expectedCash = openingAmount + cashIncome - cashExpense;

  return {
    cashIncome,
    cashExpense,
    totalSales,
    totalIncome,
    totalExpenses,
    totalRefunds,
    expectedCash
  };
}
