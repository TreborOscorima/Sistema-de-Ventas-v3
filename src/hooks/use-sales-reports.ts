import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format, parseISO, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export interface SalesReportData {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  totalProducts: number;
  cancelledSales: number;
  salesByPaymentMethod: Record<string, number>;
  salesByDay: { date: string; sales: number; transactions: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  salesByHour: { hour: number; sales: number; transactions: number }[];
}

export interface DateRange {
  from: Date;
  to: Date;
}

export type PeriodType = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export function useSalesReports() {
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

  const [reportData, setReportData] = useState<SalesReportData>({
    totalSales: 0,
    totalTransactions: 0,
    averageTicket: 0,
    totalProducts: 0,
    cancelledSales: 0,
    salesByPaymentMethod: {},
    salesByDay: [],
    topProducts: [],
    salesByHour: []
  });

  const loadReportData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch sales within date range
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });

      if (salesError) throw salesError;

      // Fetch sale items for the period
      const saleIds = sales?.map(s => s.id) || [];
      let saleItems: any[] = [];
      
      if (saleIds.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('sale_items')
          .select('*')
          .in('sale_id', saleIds);
        
        if (itemsError) throw itemsError;
        saleItems = items || [];
      }

      // Calculate metrics
      const completedSales = sales?.filter(s => s.status === 'completed') || [];
      const cancelledSales = sales?.filter(s => s.status === 'cancelled') || [];
      
      const totalSales = completedSales.reduce((sum, s) => sum + Number(s.total), 0);
      const totalTransactions = completedSales.length;
      const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      const totalProducts = saleItems.reduce((sum, item) => sum + item.quantity, 0);

      // Sales by payment method
      const salesByPaymentMethod: Record<string, number> = {};
      completedSales.forEach(sale => {
        const method = sale.payment_method || 'other';
        salesByPaymentMethod[method] = (salesByPaymentMethod[method] || 0) + Number(sale.total);
      });

      // Sales by day
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const salesByDay = days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        const daySales = completedSales.filter(s => {
          const saleDate = parseISO(s.created_at);
          return saleDate >= dayStart && saleDate <= dayEnd;
        });
        
        return {
          date: format(day, 'EEE dd', { locale: es }),
          sales: daySales.reduce((sum, s) => sum + Number(s.total), 0),
          transactions: daySales.length
        };
      });

      // Top products
      const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
      saleItems.forEach(item => {
        if (!productStats[item.product_id]) {
          productStats[item.product_id] = { name: item.product_name, quantity: 0, revenue: 0 };
        }
        productStats[item.product_id].quantity += item.quantity;
        productStats[item.product_id].revenue += Number(item.total_price);
      });
      
      const topProducts = Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Sales by hour
      const hourStats: Record<number, { sales: number; transactions: number }> = {};
      for (let i = 0; i < 24; i++) {
        hourStats[i] = { sales: 0, transactions: 0 };
      }
      
      completedSales.forEach(sale => {
        const hour = parseISO(sale.created_at).getHours();
        hourStats[hour].sales += Number(sale.total);
        hourStats[hour].transactions += 1;
      });
      
      const salesByHour = Object.entries(hourStats).map(([hour, data]) => ({
        hour: parseInt(hour),
        ...data
      }));

      setReportData({
        totalSales,
        totalTransactions,
        averageTicket,
        totalProducts,
        cancelledSales: cancelledSales.length,
        salesByPaymentMethod,
        salesByDay,
        topProducts,
        salesByHour
      });
    } catch (error) {
      console.error('Error loading report data:', error);
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
