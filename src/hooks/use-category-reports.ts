import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange, PeriodType } from './use-sales-reports';

export interface CategoryReportData {
  salesByCategory: {
    categoryId: string;
    categoryName: string;
    productCount: number;
    unitsSold: number;
    revenue: number;
    percentage: number;
  }[];
  topProductsByCategory: Record<string, { name: string; quantity: number; revenue: number }[]>;
  totalRevenue: number;
  totalUnitsSold: number;
}

export function useCategoryReports() {
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

  const [reportData, setReportData] = useState<CategoryReportData>({
    salesByCategory: [],
    topProductsByCategory: {},
    totalRevenue: 0,
    totalUnitsSold: 0
  });

  const loadReportData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (categoriesError) throw categoriesError;

      // Fetch products with their categories
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      // Fetch sales within date range
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (salesError) throw salesError;

      // Fetch sale items for these sales
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

      // Build product to category mapping
      const productCategoryMap: Record<string, { categoryId: string; categoryName: string }> = {};
      products?.forEach(product => {
        const category = product.category as any;
        productCategoryMap[product.id] = {
          categoryId: category?.id || 'uncategorized',
          categoryName: category?.name || 'Sin categoría'
        };
      });

      // Aggregate sales by category
      const categoryStats: Record<string, {
        categoryName: string;
        productCount: Set<string>;
        unitsSold: number;
        revenue: number;
        products: Record<string, { name: string; quantity: number; revenue: number }>;
      }> = {};

      // Initialize with all categories
      categories?.forEach(cat => {
        categoryStats[cat.id] = {
          categoryName: cat.name,
          productCount: new Set(),
          unitsSold: 0,
          revenue: 0,
          products: {}
        };
      });

      // Add uncategorized
      categoryStats['uncategorized'] = {
        categoryName: 'Sin categoría',
        productCount: new Set(),
        unitsSold: 0,
        revenue: 0,
        products: {}
      };

      // Process sale items
      saleItems.forEach(item => {
        const productInfo = productCategoryMap[item.product_id];
        const categoryId = productInfo?.categoryId || 'uncategorized';
        
        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = {
            categoryName: productInfo?.categoryName || 'Sin categoría',
            productCount: new Set(),
            unitsSold: 0,
            revenue: 0,
            products: {}
          };
        }

        categoryStats[categoryId].productCount.add(item.product_id);
        categoryStats[categoryId].unitsSold += item.quantity;
        categoryStats[categoryId].revenue += Number(item.total_price);

        // Track individual products
        if (!categoryStats[categoryId].products[item.product_id]) {
          categoryStats[categoryId].products[item.product_id] = {
            name: item.product_name,
            quantity: 0,
            revenue: 0
          };
        }
        categoryStats[categoryId].products[item.product_id].quantity += item.quantity;
        categoryStats[categoryId].products[item.product_id].revenue += Number(item.total_price);
      });

      // Calculate totals
      let totalRevenue = 0;
      let totalUnitsSold = 0;

      Object.values(categoryStats).forEach(stats => {
        totalRevenue += stats.revenue;
        totalUnitsSold += stats.unitsSold;
      });

      // Create final data structure
      const salesByCategory = Object.entries(categoryStats)
        .filter(([_, stats]) => stats.unitsSold > 0 || stats.productCount.size > 0)
        .map(([categoryId, stats]) => ({
          categoryId,
          categoryName: stats.categoryName,
          productCount: stats.productCount.size,
          unitsSold: stats.unitsSold,
          revenue: stats.revenue,
          percentage: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Top products by category
      const topProductsByCategory: Record<string, { name: string; quantity: number; revenue: number }[]> = {};
      Object.entries(categoryStats).forEach(([categoryId, stats]) => {
        topProductsByCategory[categoryId] = Object.values(stats.products)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
      });

      setReportData({
        salesByCategory,
        topProductsByCategory,
        totalRevenue,
        totalUnitsSold
      });
    } catch (error) {
      console.error('Error loading category report data:', error);
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
