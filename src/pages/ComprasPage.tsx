import { useState } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Trash2,
  Truck,
  ShoppingBag,
  Building2,
  Edit,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSuppliers, Supplier, SupplierFormData } from "@/hooks/use-suppliers";
import { usePurchases, Purchase } from "@/hooks/use-purchases";
import { useProducts } from "@/hooks/use-products";
import { SupplierForm } from "@/components/purchases/SupplierForm";
import { PurchaseForm } from "@/components/purchases/PurchaseForm";
import { PurchaseDetailDialog } from "@/components/purchases/PurchaseDetailDialog";

const documentTypeLabels: Record<string, string> = {
  factura: "Factura",
  boleta: "Boleta",
  guia: "Guía",
  otro: "Otro",
};

export default function ComprasPage() {
  const { suppliers, loading: loadingSuppliers, saving: savingSupplier, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const { purchases, loading: loadingPurchases, saving: savingPurchase, createPurchase, deletePurchase, getPurchaseWithItems } = usePurchases();
  const { products } = useProducts();

  const [activeTab, setActiveTab] = useState("purchases");
  const [searchTerm, setSearchTerm] = useState("");

  // Supplier dialogs
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // Purchase dialogs
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);

  // Filtered data
  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ruc?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPurchases = purchases.filter((p) =>
    p.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.document_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.total), 0);
  const thisMonthPurchases = purchases.filter(p => {
    const purchaseDate = new Date(p.purchase_date);
    const now = new Date();
    return purchaseDate.getMonth() === now.getMonth() && purchaseDate.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonthPurchases.reduce((sum, p) => sum + Number(p.total), 0);

  // Handlers
  const handleCreateSupplier = async (data: SupplierFormData) => {
    return await createSupplier(data);
  };

  const handleEditSupplier = async (data: SupplierFormData) => {
    if (!editingSupplier) return false;
    const success = await updateSupplier(editingSupplier.id, data);
    if (success) setEditingSupplier(null);
    return success;
  };

  const handleDeleteSupplier = async () => {
    if (!deletingSupplier) return;
    await deleteSupplier(deletingSupplier.id);
    setDeletingSupplier(null);
  };

  const handleDeletePurchase = async () => {
    if (!deletingPurchase) return;
    await deletePurchase(deletingPurchase.id);
    setDeletingPurchase(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Compras</h1>
          <p className="page-subtitle">Gestiona tus compras y proveedores</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "suppliers" ? (
            <Button className="btn-gradient" onClick={() => setIsSupplierFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
            </Button>
          ) : (
            <Button className="btn-gradient" onClick={() => setIsPurchaseFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Compra
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Proveedores</p>
              <p className="text-2xl font-bold">{suppliers.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <ShoppingBag className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Compras Totales</p>
              <p className="text-2xl font-bold">{purchases.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Truck className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Este Mes</p>
              <p className="text-2xl font-bold">S/ {thisMonthTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invertido</p>
              <p className="text-2xl font-bold">S/ {totalPurchases.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
            <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          </TabsList>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Purchases Tab */}
        <TabsContent value="purchases">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            {loadingPurchases ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredPurchases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No hay compras registradas</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Registra tu primera compra para comenzar
                </p>
                <Button onClick={() => setIsPurchaseFormOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Compra
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Proveedor</TableHead>
                    <TableHead className="font-semibold">Documento</TableHead>
                    <TableHead className="font-semibold text-right">Total</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase, index) => (
                    <TableRow
                      key={purchase.id}
                      className="table-row-hover animate-fade-in"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <TableCell>
                        {format(new Date(purchase.purchase_date), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {purchase.supplier?.name || "Sin proveedor"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {documentTypeLabels[purchase.document_type] || purchase.document_type}
                        </Badge>
                        {purchase.document_number && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {purchase.document_number}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        S/ {Number(purchase.total).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingPurchase(purchase)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingPurchase(purchase)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            {loadingSuppliers ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No hay proveedores</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Agrega tu primer proveedor
                </p>
                <Button onClick={() => setIsSupplierFormOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Proveedor
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">RUC</TableHead>
                    <TableHead className="font-semibold">Teléfono</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier, index) => (
                    <TableRow
                      key={supplier.id}
                      className="table-row-hover animate-fade-in"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.ruc || "-"}</TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell>{supplier.email || "-"}</TableCell>
                      <TableCell>
                        <Badge className={supplier.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                          {supplier.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingSupplier(supplier)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingSupplier(supplier)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SupplierForm
        open={isSupplierFormOpen}
        onOpenChange={setIsSupplierFormOpen}
        onSubmit={handleCreateSupplier}
        saving={savingSupplier}
      />

      <SupplierForm
        open={!!editingSupplier}
        onOpenChange={(open) => !open && setEditingSupplier(null)}
        onSubmit={handleEditSupplier}
        initialData={editingSupplier ? {
          name: editingSupplier.name,
          ruc: editingSupplier.ruc,
          phone: editingSupplier.phone,
          email: editingSupplier.email,
          address: editingSupplier.address,
          notes: editingSupplier.notes,
          is_active: editingSupplier.is_active,
        } : undefined}
        isEditing
        saving={savingSupplier}
      />

      <PurchaseForm
        open={isPurchaseFormOpen}
        onOpenChange={setIsPurchaseFormOpen}
        onSubmit={createPurchase}
        suppliers={suppliers}
        products={products}
        saving={savingPurchase}
      />

      <PurchaseDetailDialog
        open={!!viewingPurchase}
        onOpenChange={(open) => !open && setViewingPurchase(null)}
        purchase={viewingPurchase}
        onLoadDetails={getPurchaseWithItems}
      />

      {/* Delete Supplier Dialog */}
      <AlertDialog open={!!deletingSupplier} onOpenChange={(open) => !open && setDeletingSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el proveedor "{deletingSupplier?.name}" permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Purchase Dialog */}
      <AlertDialog open={!!deletingPurchase} onOpenChange={(open) => !open && setDeletingPurchase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción revertirá el stock de los productos incluidos en esta compra. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePurchase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
