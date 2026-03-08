import { useState, forwardRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  usePaymentMethods,
  useTogglePaymentMethod,
  useCreatePaymentMethod,
  useDeletePaymentMethod,
} from "@/hooks/use-payment-methods";
import {
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRightLeft,
  Plus,
  Trash2,
  Loader2,
  Circle,
  Wallet,
} from "lucide-react";
import type { PaymentMethod } from "@/lib/payment-methods";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'banknote': Banknote,
  'credit-card': CreditCard,
  'smartphone': Smartphone,
  'arrow-right-left': ArrowRightLeft,
  'wallet': Wallet,
  'circle': Circle,
};

const AVAILABLE_ICONS = [
  { key: 'banknote', label: 'Billete', Icon: Banknote },
  { key: 'credit-card', label: 'Tarjeta', Icon: CreditCard },
  { key: 'smartphone', label: 'Celular', Icon: Smartphone },
  { key: 'arrow-right-left', label: 'Transferencia', Icon: ArrowRightLeft },
  { key: 'wallet', label: 'Billetera', Icon: Wallet },
  { key: 'circle', label: 'Otro', Icon: Circle },
];

function PaymentMethodIcon({ icon, className }: { icon: string; className?: string }) {
  const IconComponent = ICON_MAP[icon] || Circle;
  return <IconComponent className={className} />;
}

export const PaymentMethodsSettings = forwardRef<HTMLDivElement>((_, ref) => {
  const { data: methods, isLoading } = usePaymentMethods();
  const toggleMethod = useTogglePaymentMethod();
  const createMethod = useCreatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("circle");
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const key = newName.trim().toLowerCase().replace(/\s+/g, '_');
    createMethod.mutate(
      { name: newName.trim(), key, icon: newIcon },
      {
        onSuccess: () => {
          setShowAddDialog(false);
          setNewName("");
          setNewIcon("circle");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card ref={ref}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Métodos de Pago
              </CardTitle>
              <CardDescription>
                Activa o desactiva los métodos de pago disponibles en el Punto de Venta
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {methods?.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <PaymentMethodIcon icon={method.icon} className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted-foreground">{method.key}</code>
                      {method.is_custom && (
                        <Badge variant="outline" className="text-xs">
                          Personalizado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {method.is_custom && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(method)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Switch
                    checked={method.is_active}
                    onCheckedChange={(checked) =>
                      toggleMethod.mutate({ id: method.id, isActive: checked })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Método de Pago</DialogTitle>
            <DialogDescription>
              Agrega un método de pago personalizado para usar en el POS
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Nequi, Mercado Pago, Daviplata..."
              />
            </div>
            <div className="space-y-2">
              <Label>Ícono</Label>
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_ICONS.map(({ key, label, Icon }) => (
                  <Button
                    key={key}
                    type="button"
                    variant={newIcon === key ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2 h-auto py-3"
                    onClick={() => setNewIcon(key)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || createMethod.isPending}
            >
              {createMethod.isPending ? "Creando..." : "Crear método"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las ventas anteriores que usaron este método conservarán su registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteMethod.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

PaymentMethodsSettings.displayName = "PaymentMethodsSettings";

export { PaymentMethodIcon, ICON_MAP };
