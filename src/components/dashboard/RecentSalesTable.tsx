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

const recentSales = [
  {
    id: "VTA-001",
    customer: "Juan Pérez",
    products: 3,
    total: "S/ 125.50",
    method: "Efectivo",
    status: "Completada",
    time: "Hace 5 min",
  },
  {
    id: "VTA-002",
    customer: "María García",
    products: 1,
    total: "S/ 45.00",
    method: "Yape",
    status: "Completada",
    time: "Hace 12 min",
  },
  {
    id: "VTA-003",
    customer: "Carlos López",
    products: 5,
    total: "S/ 289.90",
    method: "Tarjeta",
    status: "Completada",
    time: "Hace 25 min",
  },
  {
    id: "VTA-004",
    customer: "Ana Rodríguez",
    products: 2,
    total: "S/ 78.00",
    method: "Efectivo",
    status: "Pendiente",
    time: "Hace 30 min",
  },
  {
    id: "VTA-005",
    customer: "Pedro Martínez",
    products: 4,
    total: "S/ 156.80",
    method: "Plin",
    status: "Completada",
    time: "Hace 45 min",
  },
];

const paymentMethodColors: Record<string, string> = {
  Efectivo: "bg-success/10 text-success border-success/20",
  Yape: "bg-info/10 text-info border-info/20",
  Plin: "bg-warning/10 text-warning border-warning/20",
  Tarjeta: "bg-primary/10 text-primary border-primary/20",
};

const statusColors: Record<string, string> = {
  Completada: "bg-success/10 text-success",
  Pendiente: "bg-warning/10 text-warning",
  Cancelada: "bg-destructive/10 text-destructive",
};

export function RecentSalesTable() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <h3 className="text-lg font-semibold">Ventas Recientes</h3>
        <p className="text-sm text-muted-foreground">
          Últimas transacciones del día
        </p>
      </div>
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
          {recentSales.map((sale, index) => (
            <TableRow
              key={sale.id}
              className="table-row-hover cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <TableCell className="font-medium text-primary">
                {sale.id}
              </TableCell>
              <TableCell className="font-medium">{sale.customer}</TableCell>
              <TableCell className="text-center">{sale.products}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("font-medium", paymentMethodColors[sale.method])}
                >
                  {sale.method}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {sale.total}
              </TableCell>
              <TableCell>
                <Badge className={cn("font-medium", statusColors[sale.status])}>
                  {sale.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {sale.time}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
