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
  Loader2,
  AlertCircle,
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
import { usePOS } from "@/hooks/use-pos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";

export default function POSPage() {
  const {
    categories,
    products,
    cart,
    selectedPayment,
    loading,
    processing,
    activeSession,
    subtotal,
    tax,
    total,
    setSelectedPayment,
    addToCart,
    updateQuantity,
    removeFromCart,
    processSale,
  } = usePOS();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [customerName, setCustomerName] = useState("");

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      (product.category && product.category.slug === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const paymentMethods = [
    { id: "cash", name: "Efectivo", icon: Banknote },
    { id: "card", name: "Tarjeta", icon: CreditCard },
    { id: "yape", name: "Yape", icon: Smartphone },
    { id: "plin", name: "Plin", icon: Smartphone },
  ];

  const handleProcessSale = async () => {
    await processSale(customerName || undefined);
    setCustomerName("");
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Products Section */}
      <div className="flex flex-1 flex-col rounded-xl border border-border bg-card shadow-sm">
        {/* Cashbox Alert */}
        {!activeSession && (
          <Alert variant="destructive" className="m-4 mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Caja cerrada</AlertTitle>
            <AlertDescription>
              Debes abrir la caja antes de procesar ventas.{" "}
              <Link to="/caja" className="underline font-medium">
                Ir a Caja
              </Link>
            </AlertDescription>
          </Alert>
        )}

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
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "transition-all",
                selectedCategory === "all" && "btn-gradient"
              )}
            >
              Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.slug)}
                className={cn(
                  "transition-all",
                  selectedCategory === category.slug && "btn-gradient"
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
                disabled={product.stock <= 0}
                className={cn(
                  "group flex flex-col rounded-xl border border-border bg-background p-4 text-left transition-all duration-200 animate-scale-in",
                  product.stock > 0 
                    ? "hover:border-primary hover:shadow-md" 
                    : "opacity-50 cursor-not-allowed"
                )}
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
                  S/ {Number(product.price).toFixed(2)}
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
            <Input
              placeholder="Nombre del cliente (opcional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="flex-1"
            />
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
              <span>S/ {tax.toFixed(2)}</span>
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
            disabled={cart.length === 0 || !selectedPayment || !activeSession || processing}
            onClick={handleProcessSale}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Procesar Venta"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
