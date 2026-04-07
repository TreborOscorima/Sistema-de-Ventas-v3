import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, User, LogOut, Settings, AlertTriangle, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useLowStockAlerts } from "@/hooks/use-low-stock-alerts";
import { GlobalSearch } from "./GlobalSearch";
import { BranchSelector } from "./BranchSelector";

export function TopBar() {
  const { user, signOut } = useAuth();
  const { userRole, company } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { outOfStock, lowStock, totalAlerts } = useLowStockAlerts(location.pathname);

  const roleLabels: Record<string, string> = {
    owner: 'Dueño',
    admin: 'Administrador',
    cashier: 'Cajero'
  };

  const getInitials = (email: string | undefined) => {
    if (!email) return 'U';
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    setShowLogoutDialog(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-md">
        {/* Search + Branch */}
        <div className="flex items-center gap-4">
          <GlobalSearch />
          <BranchSelector />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {totalAlerts > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive">
                    {totalAlerts > 9 ? "9+" : totalAlerts}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {totalAlerts === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No hay alertas pendientes
                </div>
              ) : (
                <>
                  {outOfStock.length > 0 && (
                    <DropdownMenuItem
                      className="flex items-start gap-3 py-3 cursor-pointer"
                      onClick={() => navigate("/productos")}
                    >
                      <PackageX className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-medium">Productos agotados</span>
                        <span className="text-sm text-muted-foreground">
                          {outOfStock.length} producto{outOfStock.length > 1 ? "s" : ""} sin stock
                        </span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {lowStock.length > 0 && (
                    <DropdownMenuItem
                      className="flex items-start gap-3 py-3 cursor-pointer"
                      onClick={() => navigate("/productos")}
                    >
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-medium">Stock bajo</span>
                        <span className="text-sm text-muted-foreground">
                          {lowStock.length} producto{lowStock.length > 1 ? "s" : ""} con menos de 10 unidades
                        </span>
                      </div>
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium">{user?.email?.split('@')[0] || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground">{userRole ? roleLabels[userRole] : 'Usuario'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/configuracion?tab=perfil')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/configuracion')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={() => setShowLogoutDialog(true)}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

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
