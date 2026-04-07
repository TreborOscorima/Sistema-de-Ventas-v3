import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
import type { DetailedSaleRecord } from "@/hooks/use-detailed-sales-report";

interface Props {
  data: DetailedSaleRecord[];
  employees: { id: string; name: string }[];
  loading?: boolean;
}

export function EmployeeSalesChart({ data, employees, loading }: Props) {
  const fmt = (v: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  const completed = data.filter(s => s.status === 'completed');

  const byEmployee = employees.map(emp => {
    const empSales = completed.filter(s => s.user_id === emp.id);
    const total = empSales.reduce((s, sale) => s + sale.total, 0);
    const items = empSales.reduce((s, sale) => s + sale.items.reduce((si, i) => si + i.quantity, 0), 0);
    return {
      name: emp.name,
      transactions: empSales.length,
      total,
      items,
      avgTicket: empSales.length > 0 ? total / empSales.length : 0
    };
  }).filter(e => e.transactions > 0).sort((a, b) => b.total - a.total);

  if (loading) {
    return <Card><CardHeader><CardTitle>Ventas por Empleado</CardTitle></CardHeader><CardContent><div className="h-32 animate-pulse bg-muted rounded" /></CardContent></Card>;
  }

  if (byEmployee.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Ventas por Empleado</CardTitle></CardHeader>
        <CardContent><p className="text-center py-4 text-muted-foreground">No hay datos</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Rendimiento por Empleado</CardTitle>
        <CardDescription>Desglose de ventas por cada cajero/empleado</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empleado</TableHead>
              <TableHead className="text-right">Transacciones</TableHead>
              <TableHead className="text-right">Productos</TableHead>
              <TableHead className="text-right">Ticket Promedio</TableHead>
              <TableHead className="text-right">Total Vendido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byEmployee.map((emp, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{emp.name}</TableCell>
                <TableCell className="text-right">{emp.transactions}</TableCell>
                <TableCell className="text-right">{emp.items}</TableCell>
                <TableCell className="text-right">{fmt(emp.avgTicket)}</TableCell>
                <TableCell className="text-right font-medium text-primary">{fmt(emp.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
