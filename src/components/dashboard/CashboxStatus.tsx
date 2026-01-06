import { Wallet, Clock, TrendingUp, CreditCard, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface CashboxInfo {
  isOpen: boolean;
  openingAmount: number;
  sessionSales: number;
  totalInCashbox: number;
  openedAt: Date | null;
  sessionId: string | null;
}

interface CashboxStatusProps {
  cashboxInfo: CashboxInfo;
}

export function CashboxStatus({ cashboxInfo }: CashboxStatusProps) {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "-";
    return format(date, "hh:mm a", { locale: es });
  };

  if (!cashboxInfo.isOpen) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Estado de Caja</h3>
            <p className="text-sm text-muted-foreground">Sin sesión activa</p>
          </div>
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Cerrada
          </Badge>
        </div>

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            No hay una caja abierta actualmente
          </p>
          <Button onClick={() => navigate("/caja")}>
            Abrir Caja
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Estado de Caja</h3>
          <p className="text-sm text-muted-foreground">Sesión actual</p>
        </div>
        <Badge className="bg-success/10 text-success">Abierta</Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monto Inicial</p>
              <p className="font-semibold">{formatCurrency(cashboxInfo.openingAmount)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ventas del Turno</p>
              <p className="font-semibold text-success">{formatCurrency(cashboxInfo.sessionSales)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-info/10 p-2">
              <CreditCard className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total en Caja</p>
              <p className="font-semibold">{formatCurrency(cashboxInfo.totalInCashbox)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Abierta desde: {formatTime(cashboxInfo.openedAt)}</span>
        </div>
      </div>

      <Button 
        className="mt-6 w-full" 
        variant="outline"
        onClick={() => navigate("/caja")}
      >
        Ir a Caja
      </Button>
    </div>
  );
}
