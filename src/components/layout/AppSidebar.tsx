import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Calendar,
  Receipt,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Wallet,
  BarChart3,
  Box,
  Truck,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany, AppRole, ModuleKey } from "@/contexts/CompanyContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  module?: ModuleKey; // module key for permission check
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, module: "dashboard" },
  { name: "Punto de Venta", href: "/pos", icon: ShoppingCart, module: "pos" },
  { name: "Productos", href: "/productos", icon: Package, module: "productos" },
  { name: "Categorías", href: "/categorias", icon: Box, module: "categorias" },
  { name: "Compras", href: "/compras", icon: Truck, module: "compras" },
  { name: "Clientes", href: "/clientes", icon: Users, module: "clientes" },
  { name: "Ventas", href: "/ventas", icon: Receipt, module: "ventas" },
  { name: "Caja", href: "/caja", icon: Wallet, module: "caja" },
  { name: "Reservas", href: "/reservas", icon: Calendar, module: "reservas" },
  { name: "Reportes", href: "/reportes", icon: BarChart3, module: "reportes" },
  { name: "Comprobantes", href: "/comprobantes", icon: FileText, module: "comprobantes" },
  { name: "Reportes Fiscales", href: "/reportes-fiscales", icon: FileText, module: "comprobantes" },
  { name: "Configuración", href: "/configuracion", icon: Settings, module: "configuracion" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { hasModuleAccess } = useCompany();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowLogoutDialog(false);
  };

  const filteredNavigation = navigation.filter(
    (item) => !item.module || hasModuleAccess(item.module)
  );


  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-glow">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold text-sidebar-foreground">TUWAYKIAPP</h1>
                <p className="text-xs text-sidebar-foreground/60">Sistema de Ventas</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            const linkContent = (
              <NavLink
                to={item.href}
                className={cn(
                  "sidebar-item group",
                  isActive ? "sidebar-item-active" : "sidebar-item-inactive"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                  )}
                />
                {!collapsed && (
                  <span className="truncate animate-fade-in">{item.name}</span>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                )}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.name}>{linkContent}</div>;
          })}
        </nav>

        {/* Toggle & Logout */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span>Colapsar</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogoutDialog(true)}
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </Button>
        </div>
      </aside>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
