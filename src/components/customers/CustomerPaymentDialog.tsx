import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Customer } from '@/lib/customers';
import { Banknote, CreditCard, Smartphone, ArrowDownLeft } from 'lucide-react';

interface CustomerPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  onRegisterPayment: (customerId: string, amount: number, isDebit: boolean, description?: string) => Promise<Customer | null>;
}

const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { value: 'yape', label: 'Yape', icon: Smartphone },
  { value: 'plin', label: 'Plin', icon: Smartphone },
  { value: 'transferencia', label: 'Transferencia', icon: ArrowDownLeft },
];

export function CustomerPaymentDialog({
  open,
  onOpenChange,
  customer,
  onRegisterPayment
}: CustomerPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const debtAmount = customer.balance < 0 ? Math.abs(customer.balance) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    setLoading(true);
    try {
      const description = `Pago recibido (${paymentMethods.find(m => m.value === paymentMethod)?.label || paymentMethod})${notes ? `: ${notes}` : ''}`;
      const result = await onRegisterPayment(customer.id, parsedAmount, false, description);
      if (result) {
        setAmount('');
        setPaymentMethod('efectivo');
        setNotes('');
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayFullDebt = () => {
    if (debtAmount > 0) {
      setAmount(debtAmount.toFixed(2));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(value);
  };

  const parsedAmount = parseFloat(amount) || 0;
  const newBalance = customer.balance + parsedAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            Registrar Pago
          </DialogTitle>
          <DialogDescription>
            Registra un pago recibido de {customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Current Balance Summary */}
          <div className="rounded-lg bg-muted p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Saldo actual</p>
                <p className={`text-xl font-bold ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(customer.balance)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {customer.balance >= 0 ? 'A favor' : 'Por cobrar'}
                </p>
              </div>
              {parsedAmount > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Saldo después</p>
                  <p className={`text-xl font-bold ${newBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(newBalance)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {newBalance >= 0 ? 'A favor' : 'Por cobrar'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Monto del pago</Label>
              <div className="flex gap-2">
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1"
                />
                {debtAmount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePayFullDebt}
                    className="whitespace-nowrap"
                  >
                    Pagar todo ({formatCurrency(debtAmount)})
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Selecciona método" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <method.icon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-notes">Notas (opcional)</Label>
              <Textarea
                id="payment-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Referencia, número de operación, etc."
                rows={2}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700" 
              disabled={loading || !amount || parsedAmount <= 0}
            >
              {loading ? 'Procesando...' : `Registrar Pago de ${formatCurrency(parsedAmount)}`}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
