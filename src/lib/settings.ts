import { supabase } from "@/integrations/supabase/client";

export interface BusinessSettings {
  id: string;
  user_id: string;
  business_name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  logo_url: string | null;
  tax_rate: number;
  tax_name: string;
  receipt_header: string | null;
  receipt_footer: string | null;
  show_tax_on_receipt: boolean;
  show_logo_on_receipt: boolean;
  thermal_paper_size: '58mm' | '80mm';
  created_at: string;
  updated_at: string;
}

export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data as BusinessSettings | null;
}

export async function upsertBusinessSettings(
  settings: Partial<Omit<BusinessSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<BusinessSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user logged in');

  // Check if settings exist
  const existing = await getBusinessSettings();

  if (existing) {
    const { data, error } = await supabase
      .from('business_settings')
      .update(settings)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as BusinessSettings;
  } else {
    const { data, error } = await supabase
      .from('business_settings')
      .insert({ ...settings, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data as BusinessSettings;
  }
}

export async function updateUserProfile(data: {
  full_name?: string;
  email?: string;
}): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    email: data.email,
    data: { full_name: data.full_name }
  });

  if (error) throw error;

  // Also update the profiles table
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('profiles')
      .update({ 
        full_name: data.full_name,
        email: data.email
      })
      .eq('user_id', user.id);
  }
}

export async function updateUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // First verify the current password by attempting to sign in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('No user logged in');

  // Re-authenticate with current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword
  });

  if (signInError) {
    throw new Error('La contraseña actual es incorrecta');
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
}
