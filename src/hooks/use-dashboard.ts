import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } from "date-fns";

interface DashboardStats {
  totalSales: number;
  totalTransactions: number;
  productsSold: number;
  customersServed: number;
  salesChange: number;
  transactionsChange: number;
  productsSoldChange: number;
  customersChange: number;
}

interface RecentSale {
  id: string;
  customerName: string | null;
  itemsCount: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: Date;
}

interface CashboxInfo {
  isOpen: boolean;
  openingAmount: number;
  sessionSales: number;
  totalInCashbox: number;
  openedAt: Date | null;
  sessionId: string | null;
}

interface WeeklySalesData {
  name: string;
  ventas: number;
  meta: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export function useDashboard() {
  const { user } = useAuth();
  const { activeBranch } = useCompany();
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0, totalTransactions: 0, productsSold: 0, customersServed: 0,
    salesChange: 0, transactionsChange: 0, productsSoldChange: 0, customersChange: 0,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [cashboxInfo, setCashboxInfo] = useState<CashboxInfo>({
    isOpen: false, openingAmount: 0, sessionSales: 0, totalInCashbox: 0, openedAt: null, sessionId: null,
  });
  const [weeklySales, setWeeklySales] = useState<WeeklySalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const branchId = activeBranch?.id;

  const addBranchFilter = useCallback((query: any) => {
    if (branchId) return query.eq('branch_id', branchId);
    return query;
  }, [branchId]);

  const loadStats = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const yesterdayStart = startOfDay(subDays(today, 1));
    const yesterdayEnd = endOfDay(subDays(today, 1));

    let todayQuery = supabase
      .from("sales")
      .select("id, total, customer_id, created_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());
    if (branchId) todayQuery = todayQuery.eq('branch_id', branchId);
    const { data: todaySales } = await todayQuery;

    let yesterdayQuery = supabase
      .from("sales")
      .select("id, total, customer_id")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("created_at", yesterdayStart.toISOString())
      .lte("created_at", yesterdayEnd.toISOString());
    if (branchId) yesterdayQuery = yesterdayQuery.eq('branch_id', branchId);
    const { data: yesterdaySales } = await yesterdayQuery;

    const todaySaleIds = todaySales?.map((s) => s.id) || [];
    let todayProductsSold = 0;
    if (todaySaleIds.length > 0) {
      const { data: todayItems } = await supabase
        .from("sale_items").select("quantity").in("sale_id", todaySaleIds);
      todayProductsSold = todayItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    }

    const yesterdaySaleIds = yesterdaySales?.map((s) => s.id) || [];
    let yesterdayProductsSold = 0;
    if (yesterdaySaleIds.length > 0) {
      const { data: yesterdayItems } = await supabase
        .from("sale_items").select("quantity").in("sale_id", yesterdaySaleIds);
      yesterdayProductsSold = yesterdayItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    }

    const todayTotal = todaySales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
    const yesterdayTotal = yesterdaySales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;
    const todayTransactions = todaySales?.length || 0;
    const yesterdayTransactions = yesterdaySales?.length || 0;

    const uniqueCustomersToday = new Set(todaySales?.filter(s => s.customer_id).map(s => s.customer_id)).size;
    const uniqueCustomersYesterday = new Set(yesterdaySales?.filter(s => s.customer_id).map(s => s.customer_id)).size;

    const salesChange = yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;
    const transactionsChange = todayTransactions - yesterdayTransactions;
    const productsSoldChange = yesterdayProductsSold > 0 
      ? ((todayProductsSold - yesterdayProductsSold) / yesterdayProductsSold) * 100 : 0;
    const customersChange = uniqueCustomersToday - uniqueCustomersYesterday;

    setStats({
      totalSales: todayTotal, totalTransactions: todayTransactions,
      productsSold: todayProductsSold, customersServed: uniqueCustomersToday,
      salesChange, transactionsChange, productsSoldChange, customersChange,
    });
  }, [user, branchId]);

  const loadRecentSales = useCallback(async () => {
    if (!user) return;

    const todayStart = startOfDay(new Date());

    let query = supabase
      .from("sales")
      .select("id, customer_name, total, payment_method, status, created_at")
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(5);
    if (branchId) query = query.eq('branch_id', branchId);

    const { data: sales } = await query;

    if (sales) {
      const salesWithItems = await Promise.all(
        sales.map(async (sale) => {
          const { data: items } = await supabase
            .from("sale_items").select("quantity").eq("sale_id", sale.id);
          const itemsCount = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          return {
            id: sale.id, customerName: sale.customer_name, itemsCount,
            total: Number(sale.total), paymentMethod: sale.payment_method,
            status: sale.status, createdAt: new Date(sale.created_at),
          };
        })
      );
      setRecentSales(salesWithItems);
    }
  }, [user, branchId]);

  const loadCashboxInfo = useCallback(async () => {
    if (!user) return;

    let query = supabase
      .from("cashbox_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1);
    if (branchId) query = query.eq('branch_id', branchId);

    const { data: session } = await query.single();

    if (session) {
      const { data: sessionSales } = await supabase
        .from("sales")
        .select("total, payment_method")
        .eq("session_id", session.id)
        .eq("status", "completed");

      const cashSales = sessionSales?.filter(s => s.payment_method === "cash") || [];
      const totalCashSales = cashSales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const totalSessionSales = sessionSales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;

      setCashboxInfo({
        isOpen: true, openingAmount: Number(session.opening_amount),
        sessionSales: totalSessionSales,
        totalInCashbox: Number(session.opening_amount) + totalCashSales,
        openedAt: new Date(session.opened_at), sessionId: session.id,
      });
    } else {
      setCashboxInfo({
        isOpen: false, openingAmount: 0, sessionSales: 0, totalInCashbox: 0, openedAt: null, sessionId: null,
      });
    }
  }, [user, branchId]);

  const loadWeeklySales = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    let query = supabase
      .from("sales")
      .select("total, created_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", weekEnd.toISOString());
    if (branchId) query = query.eq('branch_id', branchId);

    const { data: sales } = await query;

    const dailySales: Record<string, number> = {};
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    dayNames.forEach((day) => { dailySales[day] = 0; });

    sales?.forEach((sale) => {
      const saleDate = new Date(sale.created_at);
      const dayIndex = (saleDate.getDay() + 6) % 7;
      dailySales[dayNames[dayIndex]] += Number(sale.total);
    });

    const totalWeekSales = Object.values(dailySales).reduce((sum, val) => sum + val, 0);
    const avgDailySales = totalWeekSales / 7;

    setWeeklySales(dayNames.map((day) => ({
      name: day, ventas: Math.round(dailySales[day]), meta: Math.round(avgDailySales),
    })));
  }, [user, branchId]);

  const loadTopProducts = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    let query = supabase
      .from("sales")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());
    if (branchId) query = query.eq('branch_id', branchId);

    const { data: todaySales } = await query;
    const saleIds = todaySales?.map((s) => s.id) || [];

    if (saleIds.length === 0) { setTopProducts([]); return; }

    const { data: items } = await supabase
      .from("sale_items").select("product_name, quantity, total_price").in("sale_id", saleIds);

    if (items) {
      const productMap: Record<string, { sales: number; revenue: number }> = {};
      items.forEach((item) => {
        if (!productMap[item.product_name]) productMap[item.product_name] = { sales: 0, revenue: 0 };
        productMap[item.product_name].sales += item.quantity;
        productMap[item.product_name].revenue += Number(item.total_price);
      });

      setTopProducts(
        Object.entries(productMap)
          .map(([name, data]) => ({ name, sales: data.sales, revenue: data.revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      );
    }
  }, [user, branchId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadRecentSales(), loadCashboxInfo(), loadWeeklySales(), loadTopProducts()]);
    setLoading(false);
  }, [loadStats, loadRecentSales, loadCashboxInfo, loadWeeklySales, loadTopProducts]);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, recentSales, cashboxInfo, weeklySales, topProducts, loading, refresh };
}
