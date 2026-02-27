import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  data: { name: string; avgCost: number; totalQty: number; totalCost: number }[];
  loading: boolean;
}

export function ProductCostsTable({ data, loading }: Props) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Costo Promedio por Producto</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[200px] w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Costo Promedio por Producto</CardTitle>
        <CardDescription>Basado en las compras del período seleccionado</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Sin datos en este período</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cant. Comprada</TableHead>
                <TableHead className="text-right">Costo Promedio</TableHead>
                <TableHead className="text-right">Total Invertido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.totalQty}</TableCell>
                  <TableCell className="text-right">{fmt(item.avgCost)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(item.totalCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
