import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface HourlySalesChartProps {
  data: { hour: number; sales: number; transactions: number }[];
  loading?: boolean;
}

export function HourlySalesChart({ data, loading }: HourlySalesChartProps) {
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  const chartData = data.map(item => ({
    ...item,
    hourLabel: formatHour(item.hour)
  }));

  // Filter to show only hours with activity or business hours (8am-10pm)
  const relevantData = chartData.filter(item => 
    item.transactions > 0 || (item.hour >= 8 && item.hour <= 22)
  );

  const formatCurrency = (value: number) => `S/ ${value.toLocaleString()}`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ventas por Hora
          </CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded w-full h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some(item => item.transactions > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ventas por Hora
          </CardTitle>
          <CardDescription>Distribución horaria de ventas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Ventas por Hora
        </CardTitle>
        <CardDescription>Distribución horaria de ventas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={relevantData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="hourLabel" 
                axisLine={false} 
                tickLine={false}
                className="text-xs fill-muted-foreground"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                className="text-xs fill-muted-foreground"
                tickFormatter={(value) => `S/${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  name === 'sales' ? formatCurrency(value) : value,
                  name === 'sales' ? 'Ventas' : 'Transacciones'
                ]}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar 
                dataKey="sales" 
                fill="hsl(var(--info))" 
                radius={[4, 4, 0, 0]}
                name="sales"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
