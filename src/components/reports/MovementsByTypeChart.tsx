import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { ArrowDownUp } from "lucide-react";

interface MovementsByTypeChartProps {
  data: Record<string, { count: number; amount: number }>;
  loading?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  'sale': 'Ventas',
  'reservation': 'Reservas',
  'withdrawal': 'Retiros',
  'deposit': 'Depósitos',
  'expense': 'Gastos',
  'opening': 'Apertura',
  'closing': 'Cierre',
  'adjustment': 'Ajustes',
  'other': 'Otros'
};

const TYPE_COLORS: Record<string, string> = {
  'sale': 'hsl(142, 76%, 36%)',
  'reservation': 'hsl(200, 70%, 50%)',
  'withdrawal': 'hsl(0, 70%, 50%)',
  'deposit': 'hsl(120, 60%, 45%)',
  'expense': 'hsl(30, 80%, 50%)',
  'opening': 'hsl(210, 60%, 50%)',
  'closing': 'hsl(280, 60%, 50%)',
  'adjustment': 'hsl(45, 80%, 50%)',
  'other': 'hsl(0, 0%, 50%)'
};

export function MovementsByTypeChart({ data, loading }: MovementsByTypeChartProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownUp className="h-5 w-5" />
            Movimientos por Tipo
          </CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(data)
    .map(([type, stats]) => ({
      type,
      label: TYPE_LABELS[type] || type,
      count: stats.count,
      amount: stats.amount,
      color: TYPE_COLORS[type] || 'hsl(var(--primary))'
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownUp className="h-5 w-5" />
            Movimientos por Tipo
          </CardTitle>
          <CardDescription>Distribución de movimientos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ArrowDownUp className="h-12 w-12 mb-2 opacity-50" />
            <p>No hay movimientos en este período</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownUp className="h-5 w-5" />
          Movimientos por Tipo
        </CardTitle>
        <CardDescription>Cantidad y monto por tipo de movimiento</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis 
                type="number" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickFormatter={(value) => `S/${Math.abs(value).toFixed(0)}`}
              />
              <YAxis 
                type="category" 
                dataKey="label" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                width={70}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${formatCurrency(Math.abs(value))} (${props.payload.count} mov.)`,
                  'Monto'
                ]}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
