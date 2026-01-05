import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package } from "lucide-react";

interface TopProductsTableProps {
  data: { name: string; quantity: number; revenue: number }[];
  loading?: boolean;
}

export function TopProductsTable({ data, loading }: TopProductsTableProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Productos Más Vendidos
          </CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Productos Más Vendidos
          </CardTitle>
          <CardDescription>Top 10 por ingresos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mb-2 opacity-50" />
            <p>No hay datos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = Math.max(...data.map(p => p.revenue));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Productos Más Vendidos
        </CardTitle>
        <CardDescription>Top 10 por ingresos</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((product, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Badge variant={index < 3 ? "default" : "secondary"}>
                    {index + 1}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{product.name}</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{ width: `${(product.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">{product.quantity}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(product.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
