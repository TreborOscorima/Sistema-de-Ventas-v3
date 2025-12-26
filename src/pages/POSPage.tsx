import { useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  ShoppingBag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", name: "Todos" },
  { id: "bebidas", name: "Bebidas" },
  { id: "snacks", name: "Snacks" },
  { id: "lacteos", name: "Lácteos" },
  { id: "limpieza", name: "Limpieza" },
  { id: "otros", name: "Otros" },
];

const products = [
  { id: 1, name: "Agua San Luis 500ml", price: 1.5, stock: 48, category: "bebidas" },
  { id: 2, name: "Coca Cola 500ml", price: 2.5, stock: 36, category: "bebidas" },
  { id: 3, name: "Gatorade Limón 500ml", price: 3.0, stock: 24, category: "bebidas" },
  { id: 4, name: "Inca Kola 500ml", price: 2.5, stock: 32, category: "bebidas" },
  { id: 5, name: "Snickers Bar", price: 2.0, stock: 20, category: "snacks" },
  { id: 6, name: "Galletas Oreo", price: 2.0, stock: 30, category: "snacks" },
  { id: 7, name: "Papitas Lays", price: 2.5, stock: 25, category: "snacks" },
  { id: 8, name: "Chocolate Sublime", price: 1.5, stock: 40, category: "snacks" },
  { id: 9, name: "Leche Gloria 1L", price: 4.5, stock: 18, category: "lacteos" },
  { id: 10, name: "Yogurt Laive", price: 3.0, stock: 15, category: "lacteos" },
  { id: 11, name: "Detergente Ace 500g", price: 8.0, stock: 12, category: "limpieza" },
  { id: 12, name: "Jabón Bolívar", price: 2.5, stock: 20, category: "limpieza" },
];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function POSPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: typeof products[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const paymentMethods = [
    { id: "cash", name: "Efectivo", icon: Banknote },
    { id: "card", name: "Tarjeta", icon: CreditCard },
    { id: "yape", name: "Yape", icon: Smartphone },
    { id: "plin", name: "Plin", icon: Smartphone },
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Products Section */}
      <div className="flex flex-1 flex-col rounded-xl border border-border bg-card shadow-sm">
        {/* Search & Categories */}
        <div className="border-b border-border p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-focus"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "transition-all",
                  selectedCategory === category.id && "btn-gradient"
                )}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product, index) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="group flex flex-col rounded-xl border border-border bg-background p-4 text-left transition-all duration-200 hover:border-primary hover:shadow-md animate-scale-in"
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      product.stock < 10
                        ? "border-warning text-warning"
                        : "border-success text-success"
                    )}
                  >
                    {product.stock}
                  </Badge>
                </div>
                <h4 className="mb-1 line-clamp-2 text-sm font-medium leading-tight">
                  {product.name}
                </h4>
                <p className="mt-auto text-lg font-bold text-primary">
                  S/ {product.price.toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Section */}
      <div className="flex w-96 flex-col rounded-xl border border-border bg-card shadow-sm">
        {/* Cart Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Carrito de Venta</h2>
            <Badge variant="secondary">{cart.length} items</Badge>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Cliente General</SelectItem>
                <SelectItem value="juan">Juan Pérez</SelectItem>
                <SelectItem value="maria">María García</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <ShoppingBag className="mb-3 h-12 w-12 opacity-50" />
              <p>El carrito está vacío</p>
              <p className="text-sm">Agrega productos para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium leading-tight">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      S/ {item.price.toFixed(2)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Cart Footer */}
        <div className="border-t border-border p-4">
          {/* Payment Methods */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            {paymentMethods.map((method) => (
              <Button
                key={method.id}
                variant={selectedPayment === method.id ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex-col gap-1 h-auto py-2",
                  selectedPayment === method.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => setSelectedPayment(method.id)}
              >
                <method.icon className="h-4 w-4" />
                <span className="text-xs">{method.name}</span>
              </Button>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>S/ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IGV (18%)</span>
              <span>S/ {igv.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            className="mt-4 w-full btn-gradient"
            size="lg"
            disabled={cart.length === 0 || !selectedPayment}
          >
            Procesar Venta
          </Button>
        </div>
      </div>
    </div>
  );
}
