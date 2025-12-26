import { Progress } from "@/components/ui/progress";

const topProducts = [
  { name: "Agua Mineral 500ml", sales: 85, revenue: "S/ 127.50" },
  { name: "Gatorade Limón", sales: 62, revenue: "S/ 186.00" },
  { name: "Snickers Bar", sales: 48, revenue: "S/ 96.00" },
  { name: "Coca Cola 500ml", sales: 45, revenue: "S/ 112.50" },
  { name: "Galletas Oreo", sales: 38, revenue: "S/ 76.00" },
];

const maxSales = Math.max(...topProducts.map((p) => p.sales));

export function TopProducts() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Productos Más Vendidos</h3>
        <p className="text-sm text-muted-foreground">Top 5 del día</p>
      </div>
      <div className="space-y-5">
        {topProducts.map((product, index) => (
          <div
            key={product.name}
            className="space-y-2 animate-slide-in-right"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-success">
                  {product.revenue}
                </span>
                <p className="text-xs text-muted-foreground">
                  {product.sales} unidades
                </p>
              </div>
            </div>
            <Progress
              value={(product.sales / maxSales) * 100}
              className="h-2"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
