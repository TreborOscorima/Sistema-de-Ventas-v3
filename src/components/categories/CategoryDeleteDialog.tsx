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
import { Loader2 } from "lucide-react";

interface CategoryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  categoryName: string;
  productCount: number;
  deleting?: boolean;
}

export function CategoryDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  categoryName,
  productCount,
  deleting = false,
}: CategoryDeleteDialogProps) {
  const hasProducts = productCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasProducts ? "No se puede eliminar" : "¿Eliminar categoría?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasProducts ? (
              <>
                La categoría <strong>"{categoryName}"</strong> tiene{" "}
                <strong>{productCount} producto{productCount !== 1 ? "s" : ""}</strong>{" "}
                asociado{productCount !== 1 ? "s" : ""}. Debes reasignar o eliminar los
                productos antes de eliminar esta categoría.
              </>
            ) : (
              <>
                Esta acción no se puede deshacer. La categoría{" "}
                <strong>"{categoryName}"</strong> será eliminada permanentemente.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {hasProducts ? "Entendido" : "Cancelar"}
          </AlertDialogCancel>
          {!hasProducts && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
