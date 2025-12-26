import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Lun", ventas: 1200, meta: 1000 },
  { name: "Mar", ventas: 1900, meta: 1500 },
  { name: "Mié", ventas: 1500, meta: 1200 },
  { name: "Jue", ventas: 2200, meta: 1800 },
  { name: "Vie", ventas: 2800, meta: 2500 },
  { name: "Sáb", ventas: 3500, meta: 3000 },
  { name: "Dom", ventas: 2100, meta: 2000 },
];

export function SalesChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Ventas de la Semana</h3>
        <p className="text-sm text-muted-foreground">
          Comparativa de ventas vs meta diaria
        </p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 9%, 46%)", fontSize: 12 }}
              tickFormatter={(value) => `S/${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 13%, 91%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number) => [`S/ ${value}`, ""]}
            />
            <Area
              type="monotone"
              dataKey="meta"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMeta)"
              name="Meta"
            />
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="hsl(221, 83%, 53%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorVentas)"
              name="Ventas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Ventas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Meta</span>
        </div>
      </div>
    </div>
  );
}
