import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SalesOverviewChartProps {
  data: { date: string; sales: number; transactions: number }[];
  loading?: boolean;
}

export function SalesOverviewChart({ data, loading }: SalesOverviewChartProps) {
  const formatCurrency = (value: number) => `S/ ${value.toLocaleString()}`;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventas del Período</CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded w-full h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas del Período</CardTitle>
        <CardDescription>Evolución de ventas y transacciones</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="area" className="space-y-4">
          <TabsList>
            <TabsTrigger value="area">Área</TabsTrigger>
            <TabsTrigger value="bar">Barras</TabsTrigger>
          </TabsList>
          
          <TabsContent value="area">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
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
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    name="sales"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="bar">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
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
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="sales"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
