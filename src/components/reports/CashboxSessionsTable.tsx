import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Banknote, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SessionData {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: string;
  totalMovements: number;
  totalSales: number;
}

interface CashboxSessionsTableProps {
  data: SessionData[];
  loading?: boolean;
}

export function CashboxSessionsTable({ data, loading }: CashboxSessionsTableProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  const formatDateTime = (dateStr: string) => {
    return format(parseISO(dateStr), "dd/MM/yy HH:mm", { locale: es });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Sesiones de Caja
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
            <Banknote className="h-5 w-5" />
            Sesiones de Caja
          </CardTitle>
          <CardDescription>Historial de sesiones en el período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Banknote className="h-12 w-12 mb-2 opacity-50" />
            <p>No hay sesiones en este período</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Sesiones de Caja
        </CardTitle>
        <CardDescription>Historial de sesiones ordenadas por fecha</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apertura</TableHead>
                <TableHead>Cierre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Monto Inicial</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Monto Final</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(session.openedAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {session.closedAt ? formatDateTime(session.closedAt) : '-'}
                  </TableCell>
                  <TableCell>
                    {session.status === 'open' ? (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Abierta
                      </Badge>
                    ) : (
                      <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Cerrada
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(session.openingAmount)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(session.totalSales)}
                  </TableCell>
                  <TableCell className="text-right">
                    {session.closingAmount !== null ? formatCurrency(session.closingAmount) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {session.difference !== null ? (
                      <span className={session.difference === 0 
                        ? 'text-green-600' 
                        : session.difference > 0 
                          ? 'text-blue-600' 
                          : 'text-destructive'
                      }>
                        {session.difference >= 0 ? '+' : ''}{formatCurrency(session.difference)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
