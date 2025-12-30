import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  Download,
  Eye,
  Printer,
  Calendar,
  Receipt,
  Loader2,
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSales } from "@/hooks/use-sales";
import { SaleReceiptModal } from "@/components/sales/SaleReceiptModal";
import { Sale, SaleItem } from "@/lib/sales";

const statusConfig = {
  completed: { label: "Completada", className: "bg-success/10 text-success" },
  pending: { label: "Pendiente", className: "bg-warning/10 text-warning" },
  cancelled: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
  transfer: "Transferencia",
};

const paymentMethodColors: Record<string, string> = {
  cash: "bg-success/10 text-success border-success/20",
  card: "bg-primary/10 text-primary border-primary/20",
  yape: "bg-info/10 text-info border-info/20",
  plin: "bg-warning/10 text-warning border-warning/20",
  transfer: "bg-accent/10 text-accent-foreground border-accent/20",
};

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');

  // Receipt modal state
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const { sales, loading, stats, getSaleDetails } = useSales({
    startDate,
    endDate,
    paymentMethod: paymentFilter,
    status: statusFilter,
  });

  // Local search filter
  const filteredSales = useMemo(() => {
    if (!searchTerm) return sales;
    const term = searchTerm.toLowerCase();
    return sales.filter(
      (sale) =>
        sale.id.toLowerCase().includes(term) ||
        (sale.customer_name?.toLowerCase().includes(term))
    );
  }, [sales, searchTerm]);

  const handleViewReceipt = async (sale: Sale) => {
    setSelectedSale(sale);
    setReceiptOpen(true);
    setLoadingItems(true);
    
    const items = await getSaleDetails(sale.id);
    setSaleItems(items);
    setLoadingItems(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (datePickerMode === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setDatePickerOpen(false);
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

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
          <p className="text-2xl font-bold text-success">S/ {stats.totalSales.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-2">
          <p className="text-sm text-muted-foreground">Transacciones</p>
          <p className="text-2xl font-bold">{stats.totalTransactions}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-3">
          <p className="text-sm text-muted-foreground">Ticket Promedio</p>
          <p className="text-2xl font-bold">
            S/ {stats.averageTicket.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-4">
          <p className="text-sm text-muted-foreground">Canceladas</p>
          <p className="text-2xl font-bold text-destructive">
            {stats.cancelledCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row flex-wrap">
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
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="card">Tarjeta</SelectItem>
              <SelectItem value="yape">Yape</SelectItem>
              <SelectItem value="plin">Plin</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Filters */}
          <div className="flex gap-2 items-center">
            <Popover open={datePickerOpen && datePickerMode === 'start'} onOpenChange={(open) => { setDatePickerOpen(open); setDatePickerMode('start'); }}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2", startDate && "bg-primary/10")}>
                  <Calendar className="h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yy") : "Desde"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover open={datePickerOpen && datePickerMode === 'end'} onOpenChange={(open) => { setDatePickerOpen(open); setDatePickerMode('end'); }}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2", endDate && "bg-primary/10")}>
                  <Calendar className="h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yy") : "Hasta"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {(startDate || endDate) && (
              <Button variant="ghost" size="sm" onClick={clearDateFilters}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm animate-slide-up">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay ventas</h3>
            <p className="text-sm text-muted-foreground">
              No se encontraron ventas con los filtros seleccionados
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">ID Venta</TableHead>
                <TableHead className="font-semibold">Fecha</TableHead>
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold text-right">Subtotal</TableHead>
                <TableHead className="font-semibold text-right">IGV</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
                <TableHead className="font-semibold">Método</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale, index) => {
                const saleDate = new Date(sale.created_at);
                const status = statusConfig[sale.status as keyof typeof statusConfig] || statusConfig.completed;
                const methodColor = paymentMethodColors[sale.payment_method] || paymentMethodColors.cash;
                const methodLabel = paymentMethodLabels[sale.payment_method] || sale.payment_method;

                return (
                  <TableRow
                    key={sale.id}
                    className="table-row-hover animate-fade-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">
                          {sale.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(saleDate, "dd/MM/yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {sale.customer_name || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      S/ {sale.subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      S/ {sale.tax.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      S/ {sale.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("font-medium", methodColor)}
                      >
                        {methodLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium", status.className)}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewReceipt(sale)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewReceipt(sale)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Receipt Modal */}
      <SaleReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        sale={selectedSale}
        items={saleItems}
        loading={loadingItems}
      />
    </div>
  );
}
