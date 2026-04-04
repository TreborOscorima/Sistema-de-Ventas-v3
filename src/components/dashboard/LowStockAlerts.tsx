import { useNavigate } from "react-router-dom";
import { AlertTriangle, PackageX, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LowStockProduct } from "@/hooks/use-low-stock-alerts";

interface LowStockAlertsProps {
  outOfStock: LowStockProduct[];
  lowStock: LowStockProduct[];
}

export function LowStockAlerts({ outOfStock, lowStock }: LowStockAlertsProps) {
  const navigate = useNavigate();
  const allProducts = [...outOfStock, ...lowStock];

  if (allProducts.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className="font-semibold text-lg">Alertas de Stock</h3>
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            {allProducts.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/productos")}>
          Ver todos
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {outOfStock.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <PackageX className="h-4 w-4 text-destructive" />
              <div>
                <p className="font-medium text-sm">{product.name}</p>
                {product.barcode && (
                  <p className="text-xs text-muted-foreground font-mono">{product.barcode}</p>
                )}
              </div>
            </div>
            <Badge className={cn("font-medium bg-destructive/10 text-destructive")}>
              Agotado
            </Badge>
          </div>
        ))}

        {lowStock.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning/5 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <div>
                <p className="font-medium text-sm">{product.name}</p>
                {product.barcode && (
                  <p className="text-xs text-muted-foreground font-mono">{product.barcode}</p>
                )}
              </div>
            </div>
            <Badge className={cn("font-medium bg-warning/10 text-warning")}>
              {product.stock} uds
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
