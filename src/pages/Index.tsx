import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { CashboxStatus } from "@/components/dashboard/CashboxStatus";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDashboard } from "@/hooks/use-dashboard";
import { useLowStockAlerts } from "@/hooks/use-low-stock-alerts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Dashboard = () => {
  const { stats, recentSales, cashboxInfo, weeklySales, topProducts, loading } = useDashboard();
  const { outOfStock, lowStock } = useLowStockAlerts();

  const formatCurrency = (value: number) => {
    return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChange = (value: number, isPercentage: boolean = true) => {
    const sign = value >= 0 ? "+" : "";
    if (isPercentage) {
      return `${sign}${value.toFixed(1)}%`;
    }
    return `${sign}${value}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Cargando datos..." icon={LayoutDashboard} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Bienvenido de vuelta. Aquí tienes un resumen de tu negocio."
        icon={LayoutDashboard}
        actions={
          <span className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium capitalize text-muted-foreground">
            {today}
          </span>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stagger-1">
          <StatCard
            title="Ventas del Día"
            value={formatCurrency(stats.totalSales)}
            change={formatChange(stats.salesChange)}
            changeType={stats.salesChange >= 0 ? "positive" : "negative"}
            description="vs. ayer"
            icon={DollarSign}
            iconColor="bg-success/10 text-success"
          />
        </div>
        <div className="stagger-2">
          <StatCard
            title="Transacciones"
            value={stats.totalTransactions.toString()}
            change={formatChange(stats.transactionsChange, false)}
            changeType={stats.transactionsChange >= 0 ? "positive" : "negative"}
            description="vs. ayer"
            icon={ShoppingCart}
            iconColor="bg-primary/10 text-primary"
          />
        </div>
        <div className="stagger-3">
          <StatCard
            title="Productos Vendidos"
            value={stats.productsSold.toString()}
            change={formatChange(stats.productsSoldChange)}
            changeType={stats.productsSoldChange >= 0 ? "positive" : "negative"}
            description="vs. ayer"
            icon={Package}
            iconColor="bg-warning/10 text-warning"
          />
        </div>
        <div className="stagger-4">
          <StatCard
            title="Clientes Atendidos"
            value={stats.customersServed.toString()}
            change={formatChange(stats.customersChange, false)}
            changeType={stats.customersChange >= 0 ? "positive" : "negative"}
            description="nuevos hoy"
            icon={Users}
            iconColor="bg-info/10 text-info"
          />
        </div>
      </div>

      {/* Quick Actions */}
      {/* Low Stock Alerts */}
      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <LowStockAlerts outOfStock={outOfStock} lowStock={lowStock} />
      )}

      <QuickActions />

      {/* Charts & Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={weeklySales} />
        </div>
        <div>
          <CashboxStatus cashboxInfo={cashboxInfo} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentSalesTable sales={recentSales} />
        </div>
        <div>
          <TopProducts products={topProducts} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
