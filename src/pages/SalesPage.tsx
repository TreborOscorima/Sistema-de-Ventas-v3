import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Printer,
  Calendar,
  Receipt,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const sales = [
  { id: "VTA-001", date: "2024-12-26 10:30", customer: "Juan Pérez", items: 3, subtotal: 106.35, igv: 19.15, total: 125.5, method: "Efectivo", status: "completed" },
  { id: "VTA-002", date: "2024-12-26 10:15", customer: "María García", items: 1, subtotal: 38.14, igv: 6.86, total: 45.0, method: "Yape", status: "completed" },
  { id: "VTA-003", date: "2024-12-26 09:45", customer: "Carlos López", items: 5, subtotal: 245.68, igv: 44.22, total: 289.9, method: "Tarjeta", status: "completed" },
  { id: "VTA-004", date: "2024-12-26 09:20", customer: "Ana Rodríguez", items: 2, subtotal: 66.1, igv: 11.9, total: 78.0, method: "Efectivo", status: "pending" },
  { id: "VTA-005", date: "2024-12-26 09:00", customer: "Pedro Martínez", items: 4, subtotal: 132.88, igv: 23.92, total: 156.8, method: "Plin", status: "completed" },
  { id: "VTA-006", date: "2024-12-25 18:30", customer: "Laura Sánchez", items: 2, subtotal: 84.75, igv: 15.25, total: 100.0, method: "Efectivo", status: "cancelled" },
  { id: "VTA-007", date: "2024-12-25 17:45", customer: "Diego Torres", items: 6, subtotal: 211.01, igv: 37.99, total: 249.0, method: "Tarjeta", status: "completed" },
  { id: "VTA-008", date: "2024-12-25 16:20", customer: "Sofía Herrera", items: 3, subtotal: 152.54, igv: 27.46, total: 180.0, method: "Yape", status: "completed" },
];

const statusConfig = {
  completed: { label: "Completada", className: "bg-success/10 text-success" },
  pending: { label: "Pendiente", className: "bg-warning/10 text-warning" },
  cancelled: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

const paymentMethodColors: Record<string, string> = {
  Efectivo: "bg-success/10 text-success border-success/20",
  Yape: "bg-info/10 text-info border-info/20",
  Plin: "bg-warning/10 text-warning border-warning/20",
  Tarjeta: "bg-primary/10 text-primary border-primary/20",
};

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSales = sales.filter(
    (sale) =>
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSales = sales.filter((s) => s.status === "completed").reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = sales.filter((s) => s.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Historial de Ventas</h1>
          <p className="page-subtitle">
            Consulta y gestiona el historial de transacciones
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-1">
          <p className="text-sm text-muted-foreground">Ventas Totales</p>
          <p className="text-2xl font-bold text-success">S/ {totalSales.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-2">
          <p className="text-sm text-muted-foreground">Transacciones</p>
          <p className="text-2xl font-bold">{totalTransactions}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-3">
          <p className="text-sm text-muted-foreground">Ticket Promedio</p>
          <p className="text-2xl font-bold">S/ {(totalSales / totalTransactions).toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-4">
          <p className="text-sm text-muted-foreground">Canceladas</p>
          <p className="text-2xl font-bold text-destructive">
            {sales.filter((s) => s.status === "cancelled").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por ID o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-focus"
            />
          </div>
          <Select>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm animate-slide-up">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">ID Venta</TableHead>
              <TableHead className="font-semibold">Fecha</TableHead>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold text-center">Items</TableHead>
              <TableHead className="font-semibold text-right">Subtotal</TableHead>
              <TableHead className="font-semibold text-right">IGV</TableHead>
              <TableHead className="font-semibold text-right">Total</TableHead>
              <TableHead className="font-semibold">Método</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale, index) => (
              <TableRow
                key={sale.id}
                className="table-row-hover animate-fade-in"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">{sale.id}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sale.date}
                </TableCell>
                <TableCell className="font-medium">{sale.customer}</TableCell>
                <TableCell className="text-center">{sale.items}</TableCell>
                <TableCell className="text-right">
                  S/ {sale.subtotal.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  S/ {sale.igv.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  S/ {sale.total.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("font-medium", paymentMethodColors[sale.method])}
                  >
                    {sale.method}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn("font-medium", statusConfig[sale.status as keyof typeof statusConfig].className)}>
                    {statusConfig[sale.status as keyof typeof statusConfig].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
