import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, DollarSign, ShoppingCart, Package, Calendar, Receipt, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparativeCardsProps {
  currentPeriod: {
    totalSales: number;
    totalTransactions: number;
    averageTicket: number;
    totalProducts: number;
    totalReservations: number;
    reservationsRevenue: number;
  };
  previousPeriod: {
    totalSales: number;
    totalTransactions: number;
    averageTicket: number;
    totalProducts: number;
    totalReservations: number;
    reservationsRevenue: number;
  };
  changes: {
    salesChange: number;
    transactionsChange: number;
    averageTicketChange: number;
    productsChange: number;
    reservationsChange: number;
    reservationsRevenueChange: number;
  };
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  currentValue: string;
  previousValue: string;
  change: number;
  icon: React.ReactNode;
  currentLabel: string;
  previousLabel: string;
}

function MetricCard({ title, currentValue, previousValue, change, icon, currentLabel, previousLabel }: MetricCardProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = isNeutral 
    ? 'text-muted-foreground' 
    : isPositive 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{currentValue}</div>
        <div className="flex items-center gap-2 mt-1">
          <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span>{isNeutral ? '0%' : `${isPositive ? '+' : ''}${change.toFixed(1)}%`}</span>
          </div>
          <span className="text-xs text-muted-foreground">vs {previousLabel}</span>
        </div>
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>{currentLabel}:</span>
            <span className="font-medium">{currentValue}</span>
          </div>
          <div className="flex justify-between">
            <span>{previousLabel}:</span>
            <span>{previousValue}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComparativeCards({
  currentPeriod,
  previousPeriod,
  changes,
  currentPeriodLabel,
  previousPeriodLabel,
  loading
}: ComparativeCardsProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 animate-pulse bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 animate-pulse bg-muted rounded mb-2" />
              <div className="h-4 w-20 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: 'Ventas Totales',
      currentValue: formatCurrency(currentPeriod.totalSales),
      previousValue: formatCurrency(previousPeriod.totalSales),
      change: changes.salesChange,
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      title: 'Transacciones',
      currentValue: currentPeriod.totalTransactions.toString(),
      previousValue: previousPeriod.totalTransactions.toString(),
      change: changes.transactionsChange,
      icon: <ShoppingCart className="h-4 w-4" />
    },
    {
      title: 'Ticket Promedio',
      currentValue: formatCurrency(currentPeriod.averageTicket),
      previousValue: formatCurrency(previousPeriod.averageTicket),
      change: changes.averageTicketChange,
      icon: <Receipt className="h-4 w-4" />
    },
    {
      title: 'Productos Vendidos',
      currentValue: currentPeriod.totalProducts.toString(),
      previousValue: previousPeriod.totalProducts.toString(),
      change: changes.productsChange,
      icon: <Package className="h-4 w-4" />
    },
    {
      title: 'Reservas',
      currentValue: currentPeriod.totalReservations.toString(),
      previousValue: previousPeriod.totalReservations.toString(),
      change: changes.reservationsChange,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      title: 'Ingresos Reservas',
      currentValue: formatCurrency(currentPeriod.reservationsRevenue),
      previousValue: formatCurrency(previousPeriod.reservationsRevenue),
      change: changes.reservationsRevenueChange,
      icon: <Percent className="h-4 w-4" />
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          currentValue={metric.currentValue}
          previousValue={metric.previousValue}
          change={metric.change}
          icon={metric.icon}
          currentLabel={currentPeriodLabel}
          previousLabel={previousPeriodLabel}
        />
      ))}
    </div>
  );
}
