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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Customer } from '@/lib/customers';
import { CustomerBalanceMovement, getCustomerMovements } from '@/lib/customer-movements';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, History, TrendingUp, TrendingDown, CreditCard, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerMovementsHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export function CustomerMovementsHistory({
  open,
  onOpenChange,
  customer
}: CustomerMovementsHistoryProps) {
  const [movements, setMovements] = useState<CustomerBalanceMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'credits' | 'debits'>('all');

  useEffect(() => {
    if (open) {
      fetchMovements();
    }
  }, [open, customer.id]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const data = await getCustomerMovements(customer.id);
      setMovements(data);
    } catch (error) {
      console.error('Error fetching movements:', error);
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

  const getMovementTypeInfo = (type: CustomerBalanceMovement['type']) => {
    const types = {
      credit_sale: { label: 'Venta a crédito', icon: CreditCard, color: 'text-red-600 bg-red-100' },
      payment: { label: 'Abono/Pago', icon: Wallet, color: 'text-green-600 bg-green-100' },
      adjustment_credit: { label: 'Ajuste (+)', icon: TrendingUp, color: 'text-green-600 bg-green-100' },
      adjustment_debit: { label: 'Ajuste (-)', icon: TrendingDown, color: 'text-red-600 bg-red-100' }
    };
    return types[type] || { label: type, icon: History, color: 'text-muted-foreground bg-muted' };
  };

  const isDebitMovement = (type: CustomerBalanceMovement['type']) => {
    return type === 'credit_sale' || type === 'adjustment_debit';
  };

  const filteredMovements = movements.filter(movement => {
    if (filter === 'all') return true;
    if (filter === 'credits') return !isDebitMovement(movement.type);
    if (filter === 'debits') return isDebitMovement(movement.type);
    return true;
  });

  const totalCredits = movements
    .filter(m => !isDebitMovement(m.type))
    .reduce((sum, m) => sum + Math.abs(m.amount), 0);

  const totalDebits = movements
    .filter(m => isDebitMovement(m.type))
    .reduce((sum, m) => sum + Math.abs(m.amount), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Movimientos - {customer.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Saldo Actual</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    customer.balance < 0 ? "text-red-600" : customer.balance > 0 ? "text-green-600" : ""
                  )}>
                    {formatCurrency(customer.balance)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">Total Abonos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalCredits)}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">Total Cargos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalDebits)}
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">Todos ({movements.length})</TabsTrigger>
                  <TabsTrigger value="credits">Abonos</TabsTrigger>
                  <TabsTrigger value="debits">Cargos</TabsTrigger>
                </TabsList>
              </Tabs>

              {filteredMovements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay movimientos registrados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.map((movement) => {
                      const typeInfo = getMovementTypeInfo(movement.type);
                      const Icon = typeInfo.icon;
                      const isDebit = isDebitMovement(movement.type);
                      
                      return (
                        <TableRow key={movement.id}>
                          <TableCell className="text-sm">
                            {format(new Date(movement.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1", typeInfo.color)}>
                              <Icon className="h-3 w-3" />
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {movement.description || '-'}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-medium",
                            isDebit ? "text-red-600" : "text-green-600"
                          )}>
                            {isDebit ? '-' : '+'}{formatCurrency(Math.abs(movement.amount))}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(movement.balance_after)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
