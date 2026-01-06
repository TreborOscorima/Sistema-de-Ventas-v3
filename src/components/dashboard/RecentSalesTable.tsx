import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface RecentSale {
  id: string;
  customerName: string | null;
  itemsCount: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: Date;
}

interface RecentSalesTableProps {
  sales: RecentSale[];
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
  transfer: "Transferencia",
  credit: "Crédito",
  other: "Otro",
};

const paymentMethodColors: Record<string, string> = {
  cash: "bg-success/10 text-success border-success/20",
  card: "bg-primary/10 text-primary border-primary/20",
  yape: "bg-info/10 text-info border-info/20",
  plin: "bg-warning/10 text-warning border-warning/20",
  transfer: "bg-secondary/10 text-secondary-foreground border-secondary/20",
  credit: "bg-destructive/10 text-destructive border-destructive/20",
  other: "bg-muted text-muted-foreground border-muted",
};

const statusLabels: Record<string, string> = {
  completed: "Completada",
  pending: "Pendiente",
  cancelled: "Cancelada",
};

const statusColors: Record<string, string> = {
  completed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  cancelled: "bg-destructive/10 text-destructive",
};

export function RecentSalesTable({ sales }: RecentSalesTableProps) {
  const formatCurrency = (value: number) => {
    return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <h3 className="text-lg font-semibold">Ventas Recientes</h3>
        <p className="text-sm text-muted-foreground">
          Últimas transacciones del día
        </p>
      </div>
      {sales.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No hay ventas registradas hoy
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold text-center">Items</TableHead>
              <TableHead className="font-semibold">Método</TableHead>
              <TableHead className="font-semibold text-right">Total</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold text-right">Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale, index) => (
              <TableRow
                key={sale.id}
                className="table-row-hover cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TableCell className="font-medium text-primary">
                  {sale.id.slice(0, 8).toUpperCase()}
                </TableCell>
                <TableCell className="font-medium">
                  {sale.customerName || "Cliente general"}
                </TableCell>
                <TableCell className="text-center">{sale.itemsCount}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("font-medium", paymentMethodColors[sale.paymentMethod] || paymentMethodColors.other)}
                  >
                    {paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(sale.total)}
                </TableCell>
                <TableCell>
                  <Badge className={cn("font-medium", statusColors[sale.status] || statusColors.pending)}>
                    {statusLabels[sale.status] || sale.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatTime(sale.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
