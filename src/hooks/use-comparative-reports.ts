import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';

export type ComparisonType = 'day' | 'week' | 'month';

export interface PeriodMetrics {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  totalProducts: number;
  totalReservations: number;
  reservationsRevenue: number;
}

export interface ComparativeReportData {
  currentPeriod: PeriodMetrics;
  previousPeriod: PeriodMetrics;
  changes: {
    salesChange: number;
    transactionsChange: number;
    averageTicketChange: number;
    productsChange: number;
    reservationsChange: number;
    reservationsRevenueChange: number;
  };
  currentPeriodLabel: string;
  previousPeriodLabel: string;
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function useComparativeReports() {
  const { user } = useAuth();
  const { activeBranch } = useCompany();
  const [loading, setLoading] = useState(true);
  const [comparisonType, setComparisonType] = useState<ComparisonType>('week');

  const [reportData, setReportData] = useState<ComparativeReportData>({
    currentPeriod: {
      totalSales: 0,
      totalTransactions: 0,
      averageTicket: 0,
      totalProducts: 0,
      totalReservations: 0,
      reservationsRevenue: 0
    },
    previousPeriod: {
      totalSales: 0,
      totalTransactions: 0,
      averageTicket: 0,
      totalProducts: 0,
      totalReservations: 0,
      reservationsRevenue: 0
    },
    changes: {
      salesChange: 0,
      transactionsChange: 0,
      averageTicketChange: 0,
      productsChange: 0,
      reservationsChange: 0,
      reservationsRevenueChange: 0
    },
    currentPeriodLabel: '',
    previousPeriodLabel: ''
  });

  const loadReportData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const now = new Date();
      let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;
      let currentLabel: string, previousLabel: string;

      switch (comparisonType) {
        case 'day':
          currentStart = startOfDay(now);
          currentEnd = endOfDay(now);
          previousStart = startOfDay(subDays(now, 1));
          previousEnd = endOfDay(subDays(now, 1));
          currentLabel = 'Hoy';
          previousLabel = 'Ayer';
          break;
        case 'week':
          currentStart = startOfWeek(now, { locale: es });
          currentEnd = endOfWeek(now, { locale: es });
          previousStart = startOfWeek(subWeeks(now, 1), { locale: es });
          previousEnd = endOfWeek(subWeeks(now, 1), { locale: es });
          currentLabel = 'Esta semana';
          previousLabel = 'Semana anterior';
          break;
        case 'month':
          currentStart = startOfMonth(now);
          currentEnd = endOfMonth(now);
          previousStart = startOfMonth(subMonths(now, 1));
          previousEnd = endOfMonth(subMonths(now, 1));
          currentLabel = format(now, 'MMMM yyyy', { locale: es });
          previousLabel = format(subMonths(now, 1), 'MMMM yyyy', { locale: es });
          break;
        default:
          currentStart = startOfWeek(now, { locale: es });
          currentEnd = endOfWeek(now, { locale: es });
          previousStart = startOfWeek(subWeeks(now, 1), { locale: es });
          previousEnd = endOfWeek(subWeeks(now, 1), { locale: es });
          currentLabel = 'Esta semana';
          previousLabel = 'Semana anterior';
      }

      // Fetch current period sales
      const { data: currentSales } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', currentStart.toISOString())
        .lte('created_at', currentEnd.toISOString());

      // Fetch previous period sales
      const { data: previousSales } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString());

      // Fetch sale items for current period
      const currentSaleIds = currentSales?.map(s => s.id) || [];
      let currentSaleItems: any[] = [];
      if (currentSaleIds.length > 0) {
        const { data } = await supabase
          .from('sale_items')
          .select('*')
          .in('sale_id', currentSaleIds);
        currentSaleItems = data || [];
      }

      // Fetch sale items for previous period
      const previousSaleIds = previousSales?.map(s => s.id) || [];
      let previousSaleItems: any[] = [];
      if (previousSaleIds.length > 0) {
        const { data } = await supabase
          .from('sale_items')
          .select('*')
          .in('sale_id', previousSaleIds);
        previousSaleItems = data || [];
      }

      // Fetch current period reservations
      const { data: currentReservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .gte('reservation_date', format(currentStart, 'yyyy-MM-dd'))
        .lte('reservation_date', format(currentEnd, 'yyyy-MM-dd'));

      // Fetch previous period reservations
      const { data: previousReservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .gte('reservation_date', format(previousStart, 'yyyy-MM-dd'))
        .lte('reservation_date', format(previousEnd, 'yyyy-MM-dd'));

      // Calculate current period metrics
      const currentTotalSales = currentSales?.reduce((sum, s) => sum + Number(s.total), 0) || 0;
      const currentTransactions = currentSales?.length || 0;
      const currentAvgTicket = currentTransactions > 0 ? currentTotalSales / currentTransactions : 0;
      const currentProducts = currentSaleItems.reduce((sum, item) => sum + item.quantity, 0);
      const currentReservationsCount = currentReservations?.length || 0;
      const currentReservationsRevenue = currentReservations?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

      // Calculate previous period metrics
      const previousTotalSales = previousSales?.reduce((sum, s) => sum + Number(s.total), 0) || 0;
      const previousTransactions = previousSales?.length || 0;
      const previousAvgTicket = previousTransactions > 0 ? previousTotalSales / previousTransactions : 0;
      const previousProducts = previousSaleItems.reduce((sum, item) => sum + item.quantity, 0);
      const previousReservationsCount = previousReservations?.length || 0;
      const previousReservationsRevenue = previousReservations?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0;

      setReportData({
        currentPeriod: {
          totalSales: currentTotalSales,
          totalTransactions: currentTransactions,
          averageTicket: currentAvgTicket,
          totalProducts: currentProducts,
          totalReservations: currentReservationsCount,
          reservationsRevenue: currentReservationsRevenue
        },
        previousPeriod: {
          totalSales: previousTotalSales,
          totalTransactions: previousTransactions,
          averageTicket: previousAvgTicket,
          totalProducts: previousProducts,
          totalReservations: previousReservationsCount,
          reservationsRevenue: previousReservationsRevenue
        },
        changes: {
          salesChange: calculateChange(currentTotalSales, previousTotalSales),
          transactionsChange: calculateChange(currentTransactions, previousTransactions),
          averageTicketChange: calculateChange(currentAvgTicket, previousAvgTicket),
          productsChange: calculateChange(currentProducts, previousProducts),
          reservationsChange: calculateChange(currentReservationsCount, previousReservationsCount),
          reservationsRevenueChange: calculateChange(currentReservationsRevenue, previousReservationsRevenue)
        },
        currentPeriodLabel: currentLabel,
        previousPeriodLabel: previousLabel
      });
    } catch (error) {
      console.error('Error loading comparative report data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, comparisonType, activeBranch?.id]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  return {
    reportData,
    loading,
    comparisonType,
    setComparisonType,
    refresh: loadReportData
  };
}
