import { Progress } from "@/components/ui/progress";

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface TopProductsProps {
  products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
  const maxSales = Math.max(...products.map((p) => p.sales), 1);

  const formatCurrency = (value: number) => {
    return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Productos Más Vendidos</h3>
        <p className="text-sm text-muted-foreground">Top 5 del día</p>
      </div>
      {products.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No hay ventas registradas hoy
        </div>
      ) : (
        <div className="space-y-5">
          {products.map((product, index) => (
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
                    {formatCurrency(product.revenue)}
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
      )}
    </div>
  );
}
