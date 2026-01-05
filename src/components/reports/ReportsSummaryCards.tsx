import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, TrendingUp, XCircle, Receipt } from "lucide-react";

interface ReportsSummaryCardsProps {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  totalProducts: number;
  cancelledSales: number;
  loading?: boolean;
}

export function ReportsSummaryCards({
  totalSales,
  totalTransactions,
  averageTicket,
  totalProducts,
  cancelledSales,
  loading
}: ReportsSummaryCardsProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  const cards = [
    {
      title: "Total Ventas",
      value: formatCurrency(totalSales),
      icon: DollarSign,
      iconColor: "bg-success/10 text-success"
    },
    {
      title: "Transacciones",
      value: totalTransactions.toString(),
      icon: ShoppingCart,
      iconColor: "bg-primary/10 text-primary"
    },
    {
      title: "Ticket Promedio",
      value: formatCurrency(averageTicket),
      icon: Receipt,
      iconColor: "bg-info/10 text-info"
    },
    {
      title: "Productos Vendidos",
      value: totalProducts.toString(),
      icon: Package,
      iconColor: "bg-warning/10 text-warning"
    },
    {
      title: "Ventas Canceladas",
      value: cancelledSales.toString(),
      icon: XCircle,
      iconColor: "bg-destructive/10 text-destructive"
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 animate-pulse bg-muted rounded" />
              <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.iconColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
