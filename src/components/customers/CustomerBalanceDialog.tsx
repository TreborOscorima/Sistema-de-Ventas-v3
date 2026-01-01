import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Customer } from '@/lib/customers';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CustomerBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  onAdjustBalance: (customerId: string, amount: number, isDebit: boolean) => Promise<Customer | null>;
}

export function CustomerBalanceDialog({
  open,
  onOpenChange,
  customer,
  onAdjustBalance
}: CustomerBalanceDialogProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'credit' | 'debit'>('credit');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    setLoading(true);
    try {
      const result = await onAdjustBalance(customer.id, parsedAmount, activeTab === 'debit');
      if (result) {
        setAmount('');
        onOpenChange(false);
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Saldo - {customer.name}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">Saldo actual</p>
            <p className={`text-3xl font-bold ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(customer.balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {customer.balance >= 0 ? 'A favor del cliente' : 'Deuda del cliente'}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'credit' | 'debit')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credit" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Abono
              </TabsTrigger>
              <TabsTrigger value="debit" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Cargo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credit">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="credit-amount">Monto a abonar</Label>
                  <Input
                    id="credit-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    El saldo aumentará (pago recibido del cliente)
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !amount}>
                  {loading ? 'Procesando...' : 'Registrar Abono'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="debit">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="debit-amount">Monto a cargar</Label>
                  <Input
                    id="debit-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    El saldo disminuirá (venta a crédito al cliente)
                  </p>
                </div>
                <Button type="submit" variant="destructive" className="w-full" disabled={loading || !amount}>
                  {loading ? 'Procesando...' : 'Registrar Cargo'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
