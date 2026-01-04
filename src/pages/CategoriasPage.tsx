import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Box, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useCategories } from "@/hooks/use-categories";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { CategoryDeleteDialog } from "@/components/categories/CategoryDeleteDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CategoriasPage() {
  const { categories, loading, saving, addCategory, editCategory, removeCategory } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string; productCount: number } | null>(null);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (name: string) => {
    return await addCategory(name);
  };

  const handleEdit = async (name: string) => {
    if (!editingCategory) return false;
    const success = await editCategory(editingCategory.id, name);
    if (success) setEditingCategory(null);
    return success;
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    const success = await removeCategory(deletingCategory.id);
    if (success) setDeletingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías de tus productos
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : categories.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                categories.filter((c) => c.productCount > 0).length
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Productos</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                categories.filter((c) => c.productCount === 0).length
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
          <CardDescription>
            {filteredCategories.length} categoría{filteredCategories.length !== 1 ? "s" : ""} encontrada{filteredCategories.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Box className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No hay categorías</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchTerm
                  ? "No se encontraron categorías con ese nombre"
                  : "Comienza creando tu primera categoría"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Categoría
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Productos</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{category.slug}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={category.productCount > 0 ? "default" : "outline"}>
                        {category.productCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(category.created_at), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCategory({ id: category.id, name: category.name })}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeletingCategory({
                              id: category.id,
                              name: category.name,
                              productCount: category.productCount,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CategoryForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        saving={saving}
      />

      {/* Edit Dialog */}
      <CategoryForm
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        onSubmit={handleEdit}
        initialName={editingCategory?.name}
        isEditing
        saving={saving}
      />

      {/* Delete Dialog */}
      <CategoryDeleteDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        onConfirm={handleDelete}
        categoryName={deletingCategory?.name || ""}
        productCount={deletingCategory?.productCount || 0}
        deleting={saving}
      />
    </div>
  );
}
