import { supabase } from "@/integrations/supabase/client";

export interface Court {
  id: string;
  name: string;
  description: string | null;
  sport_type: string;
  price_per_hour: number;
  night_price_per_hour: number | null;
  night_start_time: string | null;
  is_active: boolean;
  image_url: string | null;
  opening_time: string;
  closing_time: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  court_id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  court?: Court;
}

export async function getCourts(includeInactive = false): Promise<Court[]> {
  let query = supabase.from('courts').select('*').order('name');
  
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function uploadCourtImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('court-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('court-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function deleteCourtImage(imageUrl: string): Promise<void> {
  const fileName = imageUrl.split('/').pop();
  if (!fileName) return;

  await supabase.storage
    .from('court-images')
    .remove([fileName]);
}

export async function createCourt(court: {
  name: string;
  description?: string;
  sport_type: string;
  price_per_hour: number;
  night_price_per_hour?: number;
  night_start_time?: string;
  is_active?: boolean;
  image_url?: string;
  opening_time?: string;
  closing_time?: string;
}): Promise<Court> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('courts')
    .insert({
      ...court,
      user_id: user.id,
      is_active: court.is_active ?? true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourt(
  id: string,
  updates: Partial<Omit<Court, 'id' | 'created_at' | 'updated_at'>>
): Promise<Court> {
  const { data, error } = await supabase
    .from('courts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourt(id: string): Promise<void> {
  const { error } = await supabase
    .from('courts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getReservations(startDate?: string, endDate?: string): Promise<Reservation[]> {
  let query = supabase
    .from('reservations')
    .select('*, court:courts(*)')
    .order('reservation_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (startDate) {
    query = query.gte('reservation_date', startDate);
  }
  if (endDate) {
    query = query.lte('reservation_date', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as unknown as Reservation[];
}

export async function getReservationsByDate(date: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, court:courts(*)')
    .eq('reservation_date', date)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as Reservation[];
}

export async function createReservation(reservation: {
  court_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}): Promise<Reservation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      ...reservation,
      user_id: user.id,
      status: reservation.status || 'pending'
    })
    .select('*, court:courts(*)')
    .single();

  if (error) throw error;
  return data as unknown as Reservation;
}

export async function updateReservation(
  id: string,
  updates: Partial<Omit<Reservation, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Reservation> {
  const { data, error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', id)
    .select('*, court:courts(*)')
    .single();

  if (error) throw error;
  return data as unknown as Reservation;
}

export async function deleteReservation(id: string): Promise<void> {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateReservationStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
): Promise<Reservation> {
  return updateReservation(id, { status });
}

export function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return (endMinutes - startMinutes) / 60;
}

export function calculateTotal(
  pricePerHour: number, 
  startTime: string, 
  endTime: string,
  nightPricePerHour?: number | null,
  nightStartTime?: string | null
): number {
  // If no night pricing, use simple calculation
  if (!nightPricePerHour || !nightStartTime) {
    const hours = calculateDuration(startTime, endTime);
    return pricePerHour * hours;
  }

  const nightStart = nightStartTime.slice(0, 5);
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const [nightH, nightM] = nightStart.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const nightMinutes = nightH * 60 + nightM;

  // Calculate regular and night hours
  let regularMinutes = 0;
  let nightMinutesCount = 0;

  if (endMinutes <= nightMinutes) {
    // Entire reservation is before night hours
    regularMinutes = endMinutes - startMinutes;
  } else if (startMinutes >= nightMinutes) {
    // Entire reservation is during night hours
    nightMinutesCount = endMinutes - startMinutes;
  } else {
    // Reservation spans both periods
    regularMinutes = nightMinutes - startMinutes;
    nightMinutesCount = endMinutes - nightMinutes;
  }

  const regularHours = regularMinutes / 60;
  const nightHours = nightMinutesCount / 60;

  return (regularHours * pricePerHour) + (nightHours * nightPricePerHour);
}

export async function checkCourtAvailability(
  courtId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeReservationId?: string
): Promise<{ available: boolean; conflictingReservation?: Reservation }> {
  let query = supabase
    .from('reservations')
    .select('*, court:courts(*)')
    .eq('court_id', courtId)
    .eq('reservation_date', date)
    .neq('status', 'cancelled');

  if (excludeReservationId) {
    query = query.neq('id', excludeReservationId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const reservations = (data || []) as unknown as Reservation[];

  // Check for time overlap
  for (const reservation of reservations) {
    const resStart = reservation.start_time.slice(0, 5);
    const resEnd = reservation.end_time.slice(0, 5);

    // Check if times overlap
    if (
      (startTime >= resStart && startTime < resEnd) ||
      (endTime > resStart && endTime <= resEnd) ||
      (startTime <= resStart && endTime >= resEnd)
    ) {
      return { available: false, conflictingReservation: reservation };
    }
  }

  return { available: true };
}
