import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/lib/customers';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CustomerPurchaseHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

interface Sale {
  id: string;
  total: number;
  subtotal: number;
  tax: number;
  payment_method: string;
  status: string;
  created_at: string;
  customer_name: string | null;
}

export function CustomerPurchaseHistory({
  open,
  onOpenChange,
  customer
}: CustomerPurchaseHistoryProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchSales();
    }
  }, [open, customer.id]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(value);
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      yape: 'Yape',
      plin: 'Plin',
      other: 'Otro'
    };
    return methods[method] || method;
  };

  const totalPurchases = sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Historial de Compras - {customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Este cliente no tiene compras registradas</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total de compras</p>
                  <p className="text-2xl font-bold">{sales.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monto total</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalPurchases)}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {format(new Date(sale.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell>
                        {getPaymentMethodLabel(sale.payment_method)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                          {sale.status === 'completed' ? 'Completada' : sale.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
