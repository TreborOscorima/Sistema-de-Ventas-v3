import { ShoppingCart, Package, Users, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const actions = [
  {
    label: "Nueva Venta",
    icon: ShoppingCart,
    href: "/pos",
    variant: "default" as const,
    className: "btn-gradient",
  },
  {
    label: "Agregar Producto",
    icon: Package,
    href: "/productos",
    variant: "outline" as const,
  },
  {
    label: "Nuevo Cliente",
    icon: Users,
    href: "/clientes",
    variant: "outline" as const,
  },
  {
    label: "Nueva Reserva",
    icon: Calendar,
    href: "/reservas",
    variant: "outline" as const,
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((action, index) => (
          <Button
            key={action.label}
            variant={action.variant}
            asChild
            className={`h-auto flex-col gap-2 py-4 animate-scale-in ${action.className || ""}`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <Link to={action.href}>
              <action.icon className="h-5 w-5" />
              <span className="text-sm">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
