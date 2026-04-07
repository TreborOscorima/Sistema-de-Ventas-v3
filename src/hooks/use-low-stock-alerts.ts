import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  barcode: string | null;
}

const LOW_STOCK_THRESHOLD = 10;

export function useLowStockAlerts(refreshKey?: unknown) {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeBranch } = useCompany();

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("products")
        .select("id, name, stock, barcode")
        .eq("is_active", true)
        .lt("stock", LOW_STOCK_THRESHOLD)
        .order("stock", { ascending: true });

      if (activeBranch?.id) {
        query = query.eq("branch_id", activeBranch.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLowStockProducts(data || []);
    } catch (error) {
      console.error("Error loading low stock alerts:", error);
    } finally {
      setLoading(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const outOfStock = lowStockProducts.filter((p) => p.stock === 0);
  const lowStock = lowStockProducts.filter((p) => p.stock > 0);

  return {
    lowStockProducts,
    outOfStock,
    lowStock,
    totalAlerts: lowStockProducts.length,
    loading,
    refresh: loadAlerts,
  };
}
