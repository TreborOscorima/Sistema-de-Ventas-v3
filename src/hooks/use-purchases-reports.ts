import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format, parseISO, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PeriodType, DateRange } from './use-sales-reports';

export interface PurchasesReportData {
  totalInvested: number;
  totalPurchases: number;
  averagePurchase: number;
  totalUnits: number;
  purchasesByDay: { date: string; total: number; count: number }[];
  purchasesBySupplier: { name: string; total: number; count: number }[];
  productCosts: { name: string; avgCost: number; totalQty: number; totalCost: number }[];
}

export function usePurchasesReports() {
  const { user } = useAuth();
  const { activeBranch } = useCompany();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customRange, setCustomRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
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
        return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  }, [period, customRange]);

  const [reportData, setReportData] = useState<PurchasesReportData>({
    totalInvested: 0,
    totalPurchases: 0,
    averagePurchase: 0,
    totalUnits: 0,
    purchasesByDay: [],
    purchasesBySupplier: [],
    productCosts: []
  });

  const loadReportData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      let pQuery = supabase
        .from('purchases')
        .select('*, suppliers(name)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('purchase_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('purchase_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('purchase_date', { ascending: true });
      if (activeBranch?.id) pQuery = pQuery.eq('branch_id', activeBranch.id);

      const { data: purchases, error: pErr } = await pQuery;

      const purchaseIds = purchases?.map(p => p.id) || [];
      let items: any[] = [];
      if (purchaseIds.length > 0) {
        const { data, error } = await supabase
          .from('purchase_items')
          .select('*')
          .in('purchase_id', purchaseIds);
        if (error) throw error;
        items = data || [];
      }

      const totalInvested = purchases?.reduce((s, p) => s + Number(p.total), 0) || 0;
      const totalPurchases = purchases?.length || 0;
      const averagePurchase = totalPurchases > 0 ? totalInvested / totalPurchases : 0;
      const totalUnits = items.reduce((s, i) => s + i.quantity, 0);

      // By day
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const purchasesByDay = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayPurchases = purchases?.filter(p => p.purchase_date === dayStr) || [];
        return {
          date: format(day, 'dd MMM', { locale: es }),
          total: dayPurchases.reduce((s, p) => s + Number(p.total), 0),
          count: dayPurchases.length
        };
      });

      // By supplier
      const supplierMap: Record<string, { name: string; total: number; count: number }> = {};
      purchases?.forEach(p => {
        const name = (p.suppliers as any)?.name || 'Sin proveedor';
        if (!supplierMap[name]) supplierMap[name] = { name, total: 0, count: 0 };
        supplierMap[name].total += Number(p.total);
        supplierMap[name].count += 1;
      });
      const purchasesBySupplier = Object.values(supplierMap).sort((a, b) => b.total - a.total);

      // Product costs
      const productMap: Record<string, { name: string; totalCost: number; totalQty: number }> = {};
      items.forEach(item => {
        if (!productMap[item.product_id]) {
          productMap[item.product_id] = { name: item.product_name, totalCost: 0, totalQty: 0 };
        }
        productMap[item.product_id].totalCost += Number(item.total_cost);
        productMap[item.product_id].totalQty += item.quantity;
      });
      const productCosts = Object.values(productMap)
        .map(p => ({ ...p, avgCost: p.totalQty > 0 ? p.totalCost / p.totalQty : 0 }))
        .sort((a, b) => b.totalCost - a.totalCost);

      setReportData({
        totalInvested,
        totalPurchases,
        averagePurchase,
        totalUnits,
        purchasesByDay,
        purchasesBySupplier,
        productCosts
      });
    } catch (error) {
      console.error('Error loading purchases report:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, activeBranch?.id]);

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
