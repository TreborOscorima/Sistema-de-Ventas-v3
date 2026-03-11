import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Package,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import { useProducts, Product, ProductFormData } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductDeleteDialog } from "@/components/products/ProductDeleteDialog";

const statusConfig = {
  active: { label: "Activo", className: "bg-success/10 text-success" },
  low_stock: { label: "Stock Bajo", className: "bg-warning/10 text-warning" },
  out_of_stock: { label: "Agotado", className: "bg-destructive/10 text-destructive" },
};

export default function ProductsPage() {
  const { products, loading, saving, createProduct, updateProduct, deleteProduct, getProductStatus } = useProducts();
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase();
    return product.name.toLowerCase().includes(term) ||
      (product.barcode && product.barcode.toLowerCase().includes(term));
  });

  const stats = {
    total: products.length,
    active: products.filter((p) => getProductStatus(p) === "active").length,
    lowStock: products.filter((p) => getProductStatus(p) === "low_stock").length,
    outOfStock: products.filter((p) => getProductStatus(p) === "out_of_stock").length,
  };

  const handleCreate = async (data: ProductFormData) => {
    return await createProduct(data);
  };

  const handleEdit = async (data: ProductFormData) => {
    if (!editingProduct) return false;
    const success = await updateProduct(editingProduct.id, data);
    if (success) setEditingProduct(null);
    return success;
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    const success = await deleteProduct(deletingProduct.id);
    if (success) setDeletingProduct(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">
            Gestiona tu inventario de productos
          </p>
        </div>
        <Button className="btn-gradient" onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-focus"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-1">
          <p className="text-sm text-muted-foreground">Total Productos</p>
          <p className="text-2xl font-bold">
            {loading ? <Skeleton className="h-8 w-12" /> : stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-2">
          <p className="text-sm text-muted-foreground">En Stock</p>
          <p className="text-2xl font-bold text-success">
            {loading ? <Skeleton className="h-8 w-12" /> : stats.active}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-3">
          <p className="text-sm text-muted-foreground">Stock Bajo</p>
          <p className="text-2xl font-bold text-warning">
            {loading ? <Skeleton className="h-8 w-12" /> : stats.lowStock}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-4">
          <p className="text-sm text-muted-foreground">Agotados</p>
          <p className="text-2xl font-bold text-destructive">
            {loading ? <Skeleton className="h-8 w-12" /> : stats.outOfStock}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm animate-slide-up">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No hay productos</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {searchTerm
                ? "No se encontraron productos con ese nombre"
                : "Comienza agregando tu primer producto"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Producto</TableHead>
                <TableHead className="font-semibold">Categoría</TableHead>
                <TableHead className="font-semibold text-right">Precio</TableHead>
                <TableHead className="font-semibold text-center">Stock</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product, index) => {
                const status = getProductStatus(product);
                return (
                  <TableRow
                    key={product.id}
                    className="table-row-hover animate-fade-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="secondary">{product.category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin categoría</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      S/ {Number(product.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {product.stock}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium", statusConfig[status].className)}>
                        {statusConfig[status].label}
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
                          <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeletingProduct(product)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Dialog */}
      <ProductForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        categories={categories}
        saving={saving}
      />

      {/* Edit Dialog */}
      <ProductForm
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onSubmit={handleEdit}
        categories={categories}
        initialData={editingProduct ? {
          name: editingProduct.name,
          price: Number(editingProduct.price),
          stock: editingProduct.stock,
          category_id: editingProduct.category_id,
          barcode: editingProduct.barcode,
        } : undefined}
        isEditing
        saving={saving}
      />

      {/* Delete Dialog */}
      <ProductDeleteDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        onConfirm={handleDelete}
        productName={deletingProduct?.name || ""}
        deleting={saving}
      />
    </div>
  );
}
