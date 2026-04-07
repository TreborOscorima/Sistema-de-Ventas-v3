import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PeriodType, DateRange } from './use-sales-reports';

export interface DetailedSaleRecord {
  id: string;
  created_at: string;
  customer_name: string | null;
  payment_method: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  user_id: string;
  user_email?: string;
  branch_id: string | null;
  branch_name?: string;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export interface TaxSummary {
  totalGross: number;
  totalNet: number;
  totalTax: number;
  taxByMethod: Record<string, { gross: number; net: number; tax: number; count: number }>;
  salesCount: number;
}

export function useDetailedSalesReport() {
  const { user } = useAuth();
  const { activeBranch, company } = useCompany();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('week');
  const [customRange, setCustomRange] = useState<DateRange>({
    from: subDays(new Date(), 7),
    to: new Date()
  });

  const dateRange = useMemo((): DateRange => {
    const now = new Date();
    switch (period) {
      case 'today': return { from: startOfDay(now), to: endOfDay(now) };
      case 'yesterday': { const y = subDays(now, 1); return { from: startOfDay(y), to: endOfDay(y) }; }
      case 'week': return { from: startOfWeek(now, { locale: es }), to: endOfWeek(now, { locale: es }) };
      case 'month': return { from: startOfMonth(now), to: endOfMonth(now) };
      case 'custom': return customRange;
      default: return { from: startOfWeek(now, { locale: es }), to: endOfWeek(now, { locale: es }) };
    }
  }, [period, customRange]);

  const [sales, setSales] = useState<DetailedSaleRecord[]>([]);
  const [taxSummary, setTaxSummary] = useState<TaxSummary>({
    totalGross: 0, totalNet: 0, totalTax: 0, taxByMethod: {}, salesCount: 0
  });
  const [employees, setEmployees] = useState<{ id: string; email: string; name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const loadData = useCallback(async () => {
    if (!user || !company) return;
    try {
      setLoading(true);

      // Get all branch users for this company to enable employee filtering
      const { data: branchUsers } = await supabase
        .from('branch_users')
        .select('user_id')
        .eq('branch_id', activeBranch?.id || '');

      const userIds = branchUsers?.map(bu => bu.user_id) || [user.id];
      
      // Get profiles for employee names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      setEmployees(
        profiles?.map(p => ({ id: p.user_id, email: p.email || '', name: p.full_name || p.email || 'Sin nombre' })) || []
      );

      // Fetch sales - if owner, fetch all branch sales; otherwise only own
      let salesQuery = supabase
        .from('sales')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      if (activeBranch?.id) salesQuery = salesQuery.eq('branch_id', activeBranch.id);
      
      // Apply employee filter
      if (selectedEmployee !== 'all') {
        salesQuery = salesQuery.eq('user_id', selectedEmployee);
      }

      const { data: salesData, error: salesErr } = await salesQuery;
      if (salesErr) throw salesErr;

      // Fetch sale items
      const saleIds = salesData?.map(s => s.id) || [];
      let allItems: any[] = [];
      if (saleIds.length > 0) {
        // Batch in chunks of 100 to avoid URI limits
        for (let i = 0; i < saleIds.length; i += 100) {
          const chunk = saleIds.slice(i, i + 100);
          const { data } = await supabase
            .from('sale_items')
            .select('*')
            .in('sale_id', chunk);
          if (data) allItems = allItems.concat(data);
        }
      }

      // Get branch names
      const { data: branches } = await supabase
        .from('branches')
        .select('id, name')
        .eq('company_id', company.id);
      const branchMap = Object.fromEntries(branches?.map(b => [b.id, b.name]) || []);
      const profileMap = Object.fromEntries(profiles?.map(p => [p.user_id, p.full_name || p.email || '']) || []);

      // Build detailed records
      const detailed: DetailedSaleRecord[] = (salesData || []).map(sale => ({
        id: sale.id,
        created_at: sale.created_at,
        customer_name: sale.customer_name,
        payment_method: sale.payment_method,
        subtotal: Number(sale.subtotal),
        tax: Number(sale.tax),
        total: Number(sale.total),
        status: sale.status,
        user_id: sale.user_id,
        user_email: profileMap[sale.user_id] || '',
        branch_id: sale.branch_id,
        branch_name: sale.branch_id ? branchMap[sale.branch_id] || '' : '',
        items: allItems
          .filter(i => i.sale_id === sale.id)
          .map(i => ({
            product_name: i.product_name,
            quantity: i.quantity,
            unit_price: Number(i.unit_price),
            total_price: Number(i.total_price)
          }))
      }));

      setSales(detailed);

      // Compute tax summary
      const completed = detailed.filter(s => s.status === 'completed');
      const taxByMethod: TaxSummary['taxByMethod'] = {};
      let totalGross = 0, totalNet = 0, totalTax = 0;

      completed.forEach(s => {
        totalGross += s.total;
        totalNet += s.subtotal;
        totalTax += s.tax;
        const m = s.payment_method || 'other';
        if (!taxByMethod[m]) taxByMethod[m] = { gross: 0, net: 0, tax: 0, count: 0 };
        taxByMethod[m].gross += s.total;
        taxByMethod[m].net += s.subtotal;
        taxByMethod[m].tax += s.tax;
        taxByMethod[m].count += 1;
      });

      setTaxSummary({ totalGross, totalNet, totalTax, taxByMethod, salesCount: completed.length });

    } catch (error) {
      console.error('Error loading detailed sales report:', error);
    } finally {
      setLoading(false);
    }
  }, [user, company, dateRange, activeBranch?.id, selectedEmployee]);

  useEffect(() => { loadData(); }, [loadData]);

  return {
    sales, taxSummary, loading, employees,
    selectedEmployee, setSelectedEmployee,
    period, setPeriod, customRange, setCustomRange, dateRange,
    refresh: loadData
  };
}
