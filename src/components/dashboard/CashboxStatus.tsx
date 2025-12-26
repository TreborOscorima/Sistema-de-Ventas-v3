import { Wallet, Clock, TrendingUp, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CashboxStatus() {
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
              <p className="font-semibold">S/ 200.00</p>
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
              <p className="font-semibold text-success">S/ 1,542.50</p>
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
              <p className="font-semibold">S/ 1,742.50</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Abierta desde: 08:00 AM</span>
        </div>
      </div>

      <Button className="mt-6 w-full" variant="outline">
        Cerrar Caja
      </Button>
    </div>
  );
}
