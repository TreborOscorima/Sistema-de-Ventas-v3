import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PeriodType, DateRange } from '@/hooks/use-sales-reports';

export interface BranchSalesData {
  branchId: string;
  branchName: string;
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  totalProducts: number;
  salesByPaymentMethod: Record<string, number>;
  topProducts: { name: string; quantity: number; revenue: number }[];
}

export function useBranchComparison() {
  const { user } = useAuth();
  const { company, branches } = useCompany();
  const [loading, setLoading] = useState(false);
  const [branchData, setBranchData] = useState<BranchSalesData[]>([]);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customRange, setCustomRange] = useState<DateRange>({ from: new Date(), to: new Date() });

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'today': return { from: startOfDay(now), to: endOfDay(now) };
      case 'yesterday': { const y = subDays(now, 1); return { from: startOfDay(y), to: endOfDay(y) }; }
      case 'week': return { from: startOfWeek(now, { locale: es }), to: endOfWeek(now, { locale: es }) };
      case 'month': return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'custom': return customRange;
      default: return { from: startOfMonth(now), to: endOfMonth(now) };
    }
  }, [period, customRange]);

  const loadData = useCallback(async () => {
    if (!user || !company || branches.length === 0) return;
    setLoading(true);
    try {
      const results: BranchSalesData[] = [];

      for (const branch of branches) {
        // Fetch sales for this branch
        const { data: sales } = await supabase
          .from('sales')
          .select('*')
          .eq('branch_id', branch.id)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());

        const completedSales = (sales || []).filter(s => s.status === 'completed');
        const totalSales = completedSales.reduce((s, sale) => s + Number(sale.total), 0);
        const totalTransactions = completedSales.length;

        // Payment methods
        const salesByPaymentMethod: Record<string, number> = {};
        completedSales.forEach(sale => {
          const method = sale.payment_method || 'other';
          salesByPaymentMethod[method] = (salesByPaymentMethod[method] || 0) + Number(sale.total);
        });

        // Fetch sale items for top products
        const saleIds = completedSales.map(s => s.id);
        let totalProducts = 0;
        const productMap: Record<string, { quantity: number; revenue: number }> = {};

        if (saleIds.length > 0) {
          // Batch in chunks of 50
          for (let i = 0; i < saleIds.length; i += 50) {
            const chunk = saleIds.slice(i, i + 50);
            const { data: items } = await supabase
              .from('sale_items')
              .select('*')
              .in('sale_id', chunk);

            (items || []).forEach(item => {
              totalProducts += item.quantity;
              if (!productMap[item.product_name]) {
                productMap[item.product_name] = { quantity: 0, revenue: 0 };
              }
              productMap[item.product_name].quantity += item.quantity;
              productMap[item.product_name].revenue += Number(item.total_price);
            });
          }
        }

        const topProducts = Object.entries(productMap)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        results.push({
          branchId: branch.id,
          branchName: branch.name,
          totalSales,
          totalTransactions,
          averageTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
          totalProducts,
          salesByPaymentMethod,
          topProducts,
        });
      }

      setBranchData(results);
    } catch (error) {
      console.error('Error loading branch comparison:', error);
    } finally {
      setLoading(false);
    }
  }, [user, company, branches, dateRange]);

  useEffect(() => { loadData(); }, [loadData]);

  return {
    branchData,
    loading,
    period,
    setPeriod,
    customRange,
    setCustomRange,
    dateRange,
    refresh: loadData,
  };
}
