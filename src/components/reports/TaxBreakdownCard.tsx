import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, DollarSign } from "lucide-react";
import type { TaxSummary } from "@/hooks/use-detailed-sales-report";

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia',
  yape: 'Yape', plin: 'Plin', credit: 'Crédito', other: 'Otro'
};

interface TaxBreakdownCardProps {
  data: TaxSummary;
  taxName?: string;
  loading?: boolean;
}

export function TaxBreakdownCard({ data, taxName = 'IGV', loading }: TaxBreakdownCardProps) {
  const fmt = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Desglose Fiscal</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
        <CardContent><div className="h-32 animate-pulse bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Desglose Fiscal ({taxName})</CardTitle>
        <CardDescription>Resumen de base imponible, impuestos y totales brutos para {data.salesCount} ventas completadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Base Imponible (Neto)</p>
            <p className="text-2xl font-bold">{fmt(data.totalNet)}</p>
          </div>
          <div className="rounded-lg border p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <p className="text-sm text-muted-foreground">{taxName} Recaudado</p>
            <p className="text-2xl font-bold text-amber-600">{fmt(data.totalTax)}</p>
          </div>
          <div className="rounded-lg border p-4 border-primary/20 bg-primary/5">
            <p className="text-sm text-muted-foreground">Total Bruto</p>
            <p className="text-2xl font-bold text-primary">{fmt(data.totalGross)}</p>
          </div>
        </div>

        {/* By payment method */}
        <div>
          <h4 className="font-medium mb-2">Desglose por Método de Pago</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Transacciones</TableHead>
                <TableHead className="text-right">Base Imponible</TableHead>
                <TableHead className="text-right">{taxName}</TableHead>
                <TableHead className="text-right">Total Bruto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data.taxByMethod).map(([method, values]) => (
                <TableRow key={method}>
                  <TableCell className="font-medium">{METHOD_LABELS[method] || method}</TableCell>
                  <TableCell className="text-right">{values.count}</TableCell>
                  <TableCell className="text-right">{fmt(values.net)}</TableCell>
                  <TableCell className="text-right text-amber-600">{fmt(values.tax)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(values.gross)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">{data.salesCount}</TableCell>
                <TableCell className="text-right">{fmt(data.totalNet)}</TableCell>
                <TableCell className="text-right text-amber-600">{fmt(data.totalTax)}</TableCell>
                <TableCell className="text-right">{fmt(data.totalGross)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
