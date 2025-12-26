import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { CashboxStatus } from "@/components/dashboard/CashboxStatus";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header animate-fade-in">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Bienvenido de vuelta. Aquí tienes un resumen de tu negocio.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stagger-1">
          <StatCard
            title="Ventas del Día"
            value="S/ 3,542.80"
            change="+12.5%"
            changeType="positive"
            description="vs. ayer"
            icon={DollarSign}
            iconColor="bg-success/10 text-success"
          />
        </div>
        <div className="stagger-2">
          <StatCard
            title="Transacciones"
            value="48"
            change="+8"
            changeType="positive"
            description="vs. ayer"
            icon={ShoppingCart}
            iconColor="bg-primary/10 text-primary"
          />
        </div>
        <div className="stagger-3">
          <StatCard
            title="Productos Vendidos"
            value="156"
            change="-3%"
            changeType="negative"
            description="vs. ayer"
            icon={Package}
            iconColor="bg-warning/10 text-warning"
          />
        </div>
        <div className="stagger-4">
          <StatCard
            title="Clientes Atendidos"
            value="42"
            change="+5"
            changeType="positive"
            description="nuevos hoy"
            icon={Users}
            iconColor="bg-info/10 text-info"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts & Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div>
          <CashboxStatus />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentSalesTable />
        </div>
        <div>
          <TopProducts />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
