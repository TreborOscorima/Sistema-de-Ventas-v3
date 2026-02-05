import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { PurchaseFormData, PurchaseItemInput } from "@/hooks/use-purchases";
import { Supplier } from "@/hooks/use-suppliers";
import { Product } from "@/hooks/use-products";
import { format } from "date-fns";

interface PurchaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PurchaseFormData) => Promise<any>;
  suppliers: Supplier[];
  products: Product[];
  saving?: boolean;
}

const documentTypes = [
  { value: "factura", label: "Factura" },
  { value: "boleta", label: "Boleta" },
  { value: "guia", label: "Guía de Remisión" },
  { value: "otro", label: "Otro" },
];

export function PurchaseForm({
  open,
  onOpenChange,
  onSubmit,
  suppliers,
  products,
  saving = false,
}: PurchaseFormProps) {
  const [formData, setFormData] = useState<{
    supplier_id: string;
    document_type: string;
    document_number: string;
    purchase_date: string;
    tax: number;
    notes: string;
  }>({
    supplier_id: "",
    document_type: "factura",
    document_number: "",
    purchase_date: format(new Date(), "yyyy-MM-dd"),
    tax: 0,
    notes: "",
  });

  const [items, setItems] = useState<PurchaseItemInput[]>([]);
  const [newItem, setNewItem] = useState({
    product_id: "",
    quantity: 1,
    unit_cost: 0,
  });

  useEffect(() => {
    if (!open) {
      setFormData({
        supplier_id: "",
        document_type: "factura",
        document_number: "",
        purchase_date: format(new Date(), "yyyy-MM-dd"),
        tax: 0,
        notes: "",
      });
      setItems([]);
      setNewItem({ product_id: "", quantity: 1, unit_cost: 0 });
    }
  }, [open]);

  const handleAddItem = () => {
    const product = products.find(p => p.id === newItem.product_id);
    if (!product || newItem.quantity <= 0 || newItem.unit_cost <= 0) return;

    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        quantity: newItem.quantity,
        unit_cost: newItem.unit_cost,
      },
    ]);
    setNewItem({ product_id: "", quantity: 1, unit_cost: 0 });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  const total = subtotal + (formData.tax || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const result = await onSubmit({
      supplier_id: formData.supplier_id || null,
      document_type: formData.document_type,
      document_number: formData.document_number || null,
      purchase_date: formData.purchase_date,
      tax: formData.tax,
      notes: formData.notes || null,
      items,
    });

    if (result) {
      onOpenChange(false);
    }
  };

  const activeProducts = products.filter(p => p.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Compra</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.filter(s => s.is_active).map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name} {supplier.ruc && `(${supplier.ruc})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="purchase_date">Fecha de Compra *</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="document_type">Tipo de Documento</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document_number">Número de Documento</Label>
              <Input
                id="document_number"
                value={formData.document_number}
                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                placeholder="F001-00001"
              />
            </div>
          </div>

          {/* Add item */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <Label className="font-semibold">Agregar Productos</Label>
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <Label className="text-xs">Producto</Label>
                <Select
                  value={newItem.product_id}
                  onValueChange={(value) => setNewItem({ ...newItem, product_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Costo Unit. (S/)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unit_cost}
                  onChange={(e) => setNewItem({ ...newItem, unit_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddItem}
                  disabled={!newItem.product_id || newItem.quantity <= 0 || newItem.unit_cost <= 0}
                  className="w-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Items table */}
          {items.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.product_name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">S/ {item.unit_cost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">S/ {(item.quantity * item.unit_cost).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
            <div className="space-y-2 text-right">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>IGV:</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                  className="w-24 text-right h-8"
                />
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || items.length === 0}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Compra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
