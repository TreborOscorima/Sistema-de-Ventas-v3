import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, FileText, Search, Download } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DetailedSaleRecord } from "@/hooks/use-detailed-sales-report";

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia',
  yape: 'Yape', plin: 'Plin', credit: 'Crédito', other: 'Otro'
};

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  completed: { label: 'Completada', variant: 'default' },
  cancelled: { label: 'Anulada', variant: 'destructive' },
  pending: { label: 'Pendiente', variant: 'secondary' }
};

interface Props {
  data: DetailedSaleRecord[];
  loading?: boolean;
  employees: { id: string; name: string }[];
  selectedEmployee: string;
  onEmployeeChange: (v: string) => void;
  onExportCSV: () => void;
}

export function DetailedTransactionsTable({ data, loading, employees, selectedEmployee, onEmployeeChange, onExportCSV }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fmt = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  const filtered = data.filter(s => {
    const matchesSearch = !search || 
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      s.items.some(i => i.product_name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Log de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse bg-muted rounded" />)}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Log Detallado de Transacciones</CardTitle>
        <CardDescription>{filtered.length} transacción(es) encontrada(s) — Haga clic en una fila para ver los productos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por ID, cliente, cajero o producto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="cancelled">Anuladas</SelectItem>
            </SelectContent>
          </Select>
          {employees.length > 1 && (
            <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Empleado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los empleados</SelectItem>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={onExportCSV} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Fecha/Hora</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Cajero</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Impuesto</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No hay transacciones</TableCell></TableRow>
              ) : filtered.map(sale => {
                const isExpanded = expandedId === sale.id;
                const st = STATUS_LABELS[sale.status] || STATUS_LABELS.completed;
                return (
                  <>
                    <TableRow key={sale.id} className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : sale.id)}>
                      <TableCell>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{format(parseISO(sale.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}</TableCell>
                      <TableCell className="font-mono text-xs">{sale.id.slice(0, 8)}...</TableCell>
                      <TableCell>{sale.customer_name || '—'}</TableCell>
                      <TableCell className="text-sm">{sale.user_email || '—'}</TableCell>
                      <TableCell className="text-sm">{sale.branch_name || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{METHOD_LABELS[sale.payment_method] || sale.payment_method}</Badge></TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell className="text-right">{fmt(sale.subtotal)}</TableCell>
                      <TableCell className="text-right text-amber-600">{fmt(sale.tax)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(sale.total)}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${sale.id}-items`}>
                        <TableCell colSpan={11} className="bg-muted/30 p-0">
                          <div className="p-4">
                            <p className="text-sm font-medium mb-2">Productos de esta venta:</p>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Producto</TableHead>
                                  <TableHead className="text-right">Cantidad</TableHead>
                                  <TableHead className="text-right">Precio Unit.</TableHead>
                                  <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sale.items.map((item, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{item.product_name}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{fmt(item.unit_price)}</TableCell>
                                    <TableCell className="text-right">{fmt(item.total_price)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
