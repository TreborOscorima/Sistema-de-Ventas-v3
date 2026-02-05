import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Purchase } from "@/hooks/use-purchases";

interface PurchaseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: Purchase | null;
  onLoadDetails: (id: string) => Promise<Purchase | null>;
}

const documentTypeLabels: Record<string, string> = {
  factura: "Factura",
  boleta: "Boleta",
  guia: "Guía de Remisión",
  otro: "Otro",
};

export function PurchaseDetailDialog({
  open,
  onOpenChange,
  purchase,
  onLoadDetails,
}: PurchaseDetailDialogProps) {
  const [details, setDetails] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && purchase) {
      setLoading(true);
      onLoadDetails(purchase.id).then((data) => {
        setDetails(data);
        setLoading(false);
      });
    } else {
      setDetails(null);
    }
  }, [open, purchase, onLoadDetails]);

  if (!purchase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalle de Compra</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Proveedor</p>
              <p className="font-medium">{purchase.supplier?.name || "Sin proveedor"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fecha</p>
              <p className="font-medium">
                {format(new Date(purchase.purchase_date), "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Documento</p>
              <p className="font-medium">
                <Badge variant="secondary">
                  {documentTypeLabels[purchase.document_type] || purchase.document_type}
                </Badge>
                {purchase.document_number && ` ${purchase.document_number}`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Estado</p>
              <Badge variant="default" className="bg-success/10 text-success">
                Completada
              </Badge>
            </div>
          </div>

          {/* Items */}
          <div className="border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details?.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">S/ {Number(item.unit_cost).toFixed(2)}</TableCell>
                      <TableCell className="text-right">S/ {Number(item.total_cost).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-1 text-right">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>S/ {Number(purchase.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IGV:</span>
              <span>S/ {Number(purchase.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>S/ {Number(purchase.total).toFixed(2)}</span>
            </div>
          </div>

          {purchase.notes && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">Notas</p>
              <p className="text-sm">{purchase.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
