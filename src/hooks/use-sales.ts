import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSales, getSaleItems, Sale, SaleItem } from '@/lib/sales';
import { useToast } from '@/hooks/use-toast';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';

interface UseSalesOptions {
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: string;
  status?: string;
}

export function useSales(options: UseSalesOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSales = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allSales = await getSales(user.id, 500);
      
      let filtered = allSales;

      // Filter by date range
      if (options.startDate) {
        const start = startOfDay(options.startDate);
        filtered = filtered.filter(sale => {
          const saleDate = parseISO(sale.created_at);
          return saleDate >= start;
        });
      }

      if (options.endDate) {
        const end = endOfDay(options.endDate);
        filtered = filtered.filter(sale => {
          const saleDate = parseISO(sale.created_at);
          return saleDate <= end;
        });
      }

      // Filter by payment method
      if (options.paymentMethod && options.paymentMethod !== 'all') {
        filtered = filtered.filter(sale => sale.payment_method === options.paymentMethod);
      }

      // Filter by status
      if (options.status && options.status !== 'all') {
        filtered = filtered.filter(sale => sale.status === options.status);
      }

      setSales(filtered);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, options.startDate, options.endDate, options.paymentMethod, options.status, toast]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const getSaleDetails = async (saleId: string): Promise<SaleItem[]> => {
    try {
      return await getSaleItems(saleId);
    } catch (error) {
      console.error('Error loading sale items:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de la venta",
        variant: "destructive"
      });
      return [];
    }
  };

  // Calculate stats
  const completedSales = sales.filter(s => s.status === 'completed');
  const totalSales = completedSales.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = completedSales.length;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const cancelledCount = sales.filter(s => s.status === 'cancelled').length;

  return {
    sales,
    loading,
    refresh: loadSales,
    getSaleDetails,
    stats: {
      totalSales,
      totalTransactions,
      averageTicket,
      cancelledCount
    }
  };
}
