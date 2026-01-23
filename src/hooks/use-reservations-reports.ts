import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format, parseISO, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange, PeriodType } from './use-sales-reports';

export interface ReservationsReportData {
  totalReservations: number;
  totalRevenue: number;
  completedReservations: number;
  cancelledReservations: number;
  pendingReservations: number;
  averageReservationValue: number;
  occupancyRate: number;
  reservationsByDay: { date: string; reservations: number; revenue: number }[];
  reservationsByHour: { hour: number; count: number }[];
  reservationsByCourt: { courtId: string; courtName: string; sportType: string; reservations: number; revenue: number }[];
  popularTimeSlots: { slot: string; count: number }[];
}

export function useReservationsReports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [customRange, setCustomRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date()
  });

  const dateRange = useMemo((): DateRange => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      case 'week':
        return { from: startOfWeek(now, { locale: es }), to: endOfWeek(now, { locale: es }) };
      case 'month':
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'custom':
        return customRange;
      default:
        return { from: startOfWeek(now, { locale: es }), to: endOfWeek(now, { locale: es }) };
    }
  }, [period, customRange]);

  const [reportData, setReportData] = useState<ReservationsReportData>({
    totalReservations: 0,
    totalRevenue: 0,
    completedReservations: 0,
    cancelledReservations: 0,
    pendingReservations: 0,
    averageReservationValue: 0,
    occupancyRate: 0,
    reservationsByDay: [],
    reservationsByHour: [],
    reservationsByCourt: [],
    popularTimeSlots: []
  });

  const loadReportData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch reservations within date range
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('*, court:courts(*)')
        .eq('user_id', user.id)
        .gte('reservation_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('reservation_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('reservation_date', { ascending: true });

      if (reservationsError) throw reservationsError;

      // Fetch courts for occupancy calculation
      const { data: courts, error: courtsError } = await supabase
        .from('courts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (courtsError) throw courtsError;

      // Calculate metrics
      const completedReservations = reservations?.filter(r => r.status === 'completed') || [];
      const cancelledReservations = reservations?.filter(r => r.status === 'cancelled') || [];
      const pendingReservations = reservations?.filter(r => r.status === 'pending' || r.status === 'confirmed') || [];
      
      const activeReservations = reservations?.filter(r => r.status !== 'cancelled') || [];
      const totalRevenue = activeReservations.reduce((sum, r) => sum + Number(r.total_amount), 0);
      const averageReservationValue = activeReservations.length > 0 ? totalRevenue / activeReservations.length : 0;

      // Reservations by day
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const reservationsByDay = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayReservations = activeReservations.filter(r => r.reservation_date === dayStr);
        
        return {
          date: format(day, 'EEE dd', { locale: es }),
          reservations: dayReservations.length,
          revenue: dayReservations.reduce((sum, r) => sum + Number(r.total_amount), 0)
        };
      });

      // Reservations by hour
      const hourStats: Record<number, number> = {};
      for (let i = 0; i < 24; i++) {
        hourStats[i] = 0;
      }
      
      activeReservations.forEach(reservation => {
        const hour = parseInt(reservation.start_time.split(':')[0]);
        hourStats[hour]++;
      });
      
      const reservationsByHour = Object.entries(hourStats).map(([hour, count]) => ({
        hour: parseInt(hour),
        count
      }));

      // Reservations by court
      const courtStats: Record<string, { courtName: string; sportType: string; reservations: number; revenue: number }> = {};
      activeReservations.forEach(reservation => {
        const court = reservation.court as any;
        if (!courtStats[reservation.court_id]) {
          courtStats[reservation.court_id] = {
            courtName: court?.name || 'Desconocido',
            sportType: court?.sport_type || 'Otro',
            reservations: 0,
            revenue: 0
          };
        }
        courtStats[reservation.court_id].reservations++;
        courtStats[reservation.court_id].revenue += Number(reservation.total_amount);
      });

      const reservationsByCourt = Object.entries(courtStats)
        .map(([courtId, data]) => ({ courtId, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      // Popular time slots
      const timeSlotStats: Record<string, number> = {};
      activeReservations.forEach(reservation => {
        const slot = `${reservation.start_time.slice(0, 5)} - ${reservation.end_time.slice(0, 5)}`;
        timeSlotStats[slot] = (timeSlotStats[slot] || 0) + 1;
      });

      const popularTimeSlots = Object.entries(timeSlotStats)
        .map(([slot, count]) => ({ slot, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate occupancy rate (simplified: hours reserved / total available hours)
      const totalDays = days.length;
      const totalCourts = courts?.length || 1;
      const averageHoursPerDay = 12; // Assuming 12 hours of operation
      const totalAvailableHours = totalDays * totalCourts * averageHoursPerDay;
      
      let totalReservedHours = 0;
      activeReservations.forEach(r => {
        const startHour = parseInt(r.start_time.split(':')[0]);
        const endHour = parseInt(r.end_time.split(':')[0]);
        totalReservedHours += endHour - startHour;
      });

      const occupancyRate = totalAvailableHours > 0 ? (totalReservedHours / totalAvailableHours) * 100 : 0;

      setReportData({
        totalReservations: activeReservations.length,
        totalRevenue,
        completedReservations: completedReservations.length,
        cancelledReservations: cancelledReservations.length,
        pendingReservations: pendingReservations.length,
        averageReservationValue,
        occupancyRate: Math.min(occupancyRate, 100),
        reservationsByDay,
        reservationsByHour,
        reservationsByCourt,
        popularTimeSlots
      });
    } catch (error) {
      console.error('Error loading reservations report data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  return {
    reportData,
    loading,
    period,
    setPeriod,
    customRange,
    setCustomRange,
    dateRange,
    refresh: loadReportData
  };
}
