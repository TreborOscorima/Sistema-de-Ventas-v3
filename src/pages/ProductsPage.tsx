import { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const products = [
  { id: 1, code: "PRD-001", name: "Agua San Luis 500ml", category: "Bebidas", price: 1.5, stock: 48, status: "active" },
  { id: 2, code: "PRD-002", name: "Coca Cola 500ml", category: "Bebidas", price: 2.5, stock: 36, status: "active" },
  { id: 3, code: "PRD-003", name: "Gatorade Limón 500ml", category: "Bebidas", price: 3.0, stock: 24, status: "active" },
  { id: 4, code: "PRD-004", name: "Snickers Bar", category: "Snacks", price: 2.0, stock: 8, status: "low_stock" },
  { id: 5, code: "PRD-005", name: "Galletas Oreo", category: "Snacks", price: 2.0, stock: 30, status: "active" },
  { id: 6, code: "PRD-006", name: "Papitas Lays", category: "Snacks", price: 2.5, stock: 5, status: "low_stock" },
  { id: 7, code: "PRD-007", name: "Leche Gloria 1L", category: "Lácteos", price: 4.5, stock: 18, status: "active" },
  { id: 8, code: "PRD-008", name: "Yogurt Laive", category: "Lácteos", price: 3.0, stock: 0, status: "out_of_stock" },
  { id: 9, code: "PRD-009", name: "Detergente Ace 500g", category: "Limpieza", price: 8.0, stock: 12, status: "active" },
  { id: 10, code: "PRD-010", name: "Jabón Bolívar", category: "Limpieza", price: 2.5, stock: 20, status: "active" },
];

const statusConfig = {
  active: { label: "Activo", className: "bg-success/10 text-success" },
  low_stock: { label: "Stock Bajo", className: "bg-warning/10 text-warning" },
  out_of_stock: { label: "Agotado", className: "bg-destructive/10 text-destructive" },
};

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Producto</DialogTitle>
              <DialogDescription>
                Ingresa los datos del nuevo producto
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" placeholder="Nombre del producto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input id="price" type="number" placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" type="number" placeholder="0" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Categoría</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bebidas">Bebidas</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                    <SelectItem value="lacteos">Lácteos</SelectItem>
                    <SelectItem value="limpieza">Limpieza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="btn-gradient" onClick={() => setIsDialogOpen(false)}>
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o código..."
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
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-2">
          <p className="text-sm text-muted-foreground">En Stock</p>
          <p className="text-2xl font-bold text-success">
            {products.filter((p) => p.status === "active").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-3">
          <p className="text-sm text-muted-foreground">Stock Bajo</p>
          <p className="text-2xl font-bold text-warning">
            {products.filter((p) => p.status === "low_stock").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 animate-scale-in stagger-4">
          <p className="text-sm text-muted-foreground">Agotados</p>
          <p className="text-2xl font-bold text-destructive">
            {products.filter((p) => p.status === "out_of_stock").length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm animate-slide-up">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Código</TableHead>
              <TableHead className="font-semibold">Producto</TableHead>
              <TableHead className="font-semibold">Categoría</TableHead>
              <TableHead className="font-semibold text-right">Precio</TableHead>
              <TableHead className="font-semibold text-center">Stock</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product, index) => (
              <TableRow
                key={product.id}
                className="table-row-hover animate-fade-in"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {product.code}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.category}</Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  S/ {product.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {product.stock}
                </TableCell>
                <TableCell>
                  <Badge className={cn("font-medium", statusConfig[product.status as keyof typeof statusConfig].className)}>
                    {statusConfig[product.status as keyof typeof statusConfig].label}
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
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
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
      </div>
    </div>
  );
}
