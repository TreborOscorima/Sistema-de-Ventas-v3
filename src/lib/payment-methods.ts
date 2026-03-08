import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethod {
  id: string;
  company_id: string;
  name: string;
  key: string;
  icon: string;
  is_active: boolean;
  is_custom: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getPaymentMethods(companyId: string): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('company_id', companyId)
    .order('sort_order');

  if (error) throw error;
  
  // If no methods exist, seed defaults
  if (!data || data.length === 0) {
    await supabase.rpc('seed_default_payment_methods', { _company_id: companyId });
    const { data: seeded, error: seedError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order');
    if (seedError) throw seedError;
    return (seeded || []) as PaymentMethod[];
  }

  return data as PaymentMethod[];
}

export async function togglePaymentMethod(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('payment_methods')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function createPaymentMethod(
  companyId: string,
  name: string,
  key: string,
  icon: string = 'circle'
): Promise<PaymentMethod> {
  // Get max sort_order
  const { data: existing } = await supabase
    .from('payment_methods')
    .select('sort_order')
    .eq('company_id', companyId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const sortOrder = (existing?.[0]?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from('payment_methods')
    .insert({
      company_id: companyId,
      name,
      key: key.toLowerCase().replace(/\s+/g, '_'),
      icon,
      is_custom: true,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PaymentMethod;
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function updatePaymentMethod(id: string, updates: { name?: string; icon?: string }): Promise<void> {
  const { error } = await supabase
    .from('payment_methods')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
