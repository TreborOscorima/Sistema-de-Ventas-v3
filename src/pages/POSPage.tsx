import { useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingBag,
  Loader2,
  AlertCircle,
  UserCheck,
  Receipt,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { usePOS } from "@/hooks/use-pos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function POSPage() {
  const {
    categories,
    products,
    customers,
    pendingReservations,
    cart,
    reservationCart,
    selectedPayment,
    selectedCustomer,
    isCredit,
    loading,
    processing,
    activeSession,
    subtotal,
    tax,
    total,
    productTotal,
    reservationsTotal,
    setSelectedPayment,
    setSelectedCustomer,
    setIsCredit,
    addToCart,
    updateQuantity,
    removeFromCart,
    processSale,
    addReservationToCart,
    removeReservationFromCart,
  } = usePOS();

  const [searchTerm, setSearchTerm] = useState("");
  const [reservationSearchTerm, setReservationSearchTerm] = useState("");
  const [reservationDateFilter, setReservationDateFilter] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [activeTab, setActiveTab] = useState("products");

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
    const success = await processSale(selectedCustomer?.name);
    if (success) {
      setCashReceived("");
    }
  };

  const hasProducts = cart.length > 0;
  const hasReservations = reservationCart.length > 0;
  const hasItems = hasProducts || hasReservations;
  const isCombinedSale = hasProducts && hasReservations;

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "none") {
      setSelectedCustomer(null);
      setIsCredit(false);
    } else {
      const customer = customers.find(c => c.id === customerId);
      setSelectedCustomer(customer || null);
    }
  };

  const handleCreditToggle = (checked: boolean) => {
    if (checked && !selectedCustomer) {
      return; // Can't enable credit without customer
    }
    setIsCredit(checked);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "EEE d 'de' MMM", { locale: es });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // "HH:mm"
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
      {/* Products/Reservations Section */}
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
          <div className="border-b border-border p-4 pb-0">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Productos
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Reservas
                {pendingReservations.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                    {pendingReservations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Products Tab */}
          <TabsContent value="products" className="flex-1 flex flex-col m-0">
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
                {filteredProducts.map((product, index) => {
                  const isInCart = reservationCart.some(r => r.id === product.id);
                  return (
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
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="flex-1 flex flex-col m-0">
            {/* Search and Date Filter for reservations */}
            <div className="border-b border-border p-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por cliente o cancha..."
                    value={reservationSearchTerm}
                    onChange={(e) => setReservationSearchTerm(e.target.value)}
                    className="pl-10 input-focus"
                  />
                </div>
                <div className="relative w-[160px]">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={reservationDateFilter}
                    onChange={(e) => setReservationDateFilter(e.target.value)}
                    className="pl-10 input-focus"
                  />
                </div>
                {reservationDateFilter && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setReservationDateFilter("")}
                    className="shrink-0"
                    title="Limpiar filtro de fecha"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {pendingReservations.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground py-12">
                  <Calendar className="mb-3 h-12 w-12 opacity-50" />
                  <p>No hay reservas pendientes de cobro</p>
                  <p className="text-sm">Las reservas confirmadas aparecerán aquí</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pendingReservations
                  .filter((reservation) => {
                    // Text search filter
                    if (reservationSearchTerm) {
                      const searchLower = reservationSearchTerm.toLowerCase();
                      const matchesCustomer = reservation.customer_name.toLowerCase().includes(searchLower);
                      const matchesCourt = reservation.court?.name?.toLowerCase().includes(searchLower);
                      if (!matchesCustomer && !matchesCourt) return false;
                    }
                    // Date filter
                    if (reservationDateFilter) {
                      if (reservation.reservation_date !== reservationDateFilter) return false;
                    }
                    return true;
                  })
                  .map((reservation, index) => {
                    const isInCart = reservationCart.some(r => r.id === reservation.id);
                    return (
                      <button
                        key={reservation.id}
                        onClick={() => addReservationToCart(reservation)}
                        disabled={isInCart}
                        className={cn(
                          "group flex flex-col rounded-xl border border-border bg-background p-4 text-left transition-all duration-200 animate-scale-in",
                          !isInCart
                            ? "hover:border-primary hover:shadow-md"
                            : "opacity-50 cursor-not-allowed",
                          isInCart && "border-primary bg-primary/5"
                        )}
                        style={{ animationDelay: `${index * 0.02}s` }}
                      >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <Badge
                          variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {reservation.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                        </Badge>
                      </div>
                      
                      <h4 className="mb-1 font-semibold text-foreground">
                        {reservation.court?.name || 'Cancha'}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {reservation.customer_name}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(reservation.reservation_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}</span>
                      </div>
                      
                      <p className="mt-auto text-lg font-bold text-primary">
                        S/ {Number(reservation.total_amount).toFixed(2)}
                      </p>
                    </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart Section */}
      <div className="flex w-96 flex-col rounded-xl border border-border bg-card shadow-sm">
        {/* Cart Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isCombinedSale ? "Venta Combinada" : hasReservations ? "Cobro de Reservas" : "Carrito de Venta"}
            </h2>
            <Badge variant="secondary">
              {cart.length + reservationCart.length} items
            </Badge>
          </div>
          
          {/* Customer Selector */}
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedCustomer?.id || "none"}
                onValueChange={handleCustomerChange}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar cliente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{customer.name}</span>
                        {customer.balance !== 0 && (
                          <span className={cn(
                            "text-xs ml-2",
                            customer.balance > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            ({formatCurrency(customer.balance)})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Credit Sale Toggle - Only for product sales */}
            {hasProducts && selectedCustomer && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="credit-toggle" className="text-sm cursor-pointer">
                    Venta a crédito (solo productos)
                  </Label>
                </div>
                <Switch
                  id="credit-toggle"
                  checked={isCredit}
                  onCheckedChange={handleCreditToggle}
                />
              </div>
            )}

            {isCredit && selectedCustomer && hasProducts && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600">
                  Se cargará S/ {productTotal.toFixed(2)} a la cuenta de {selectedCustomer.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Saldo actual: {formatCurrency(selectedCustomer.balance)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {!hasItems ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <ShoppingBag className="mb-3 h-12 w-12 opacity-50" />
              <p>El carrito está vacío</p>
              <p className="text-sm">Agrega productos o reservas para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Reservations in cart */}
              {reservationCart.length > 0 && (
                <>
                  {hasProducts && (
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Reservas
                    </p>
                  )}
                  {reservationCart.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{reservation.courtName}</p>
                        <p className="text-xs text-muted-foreground truncate">{reservation.customerName}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <span>{formatDate(reservation.date)}</span>
                          <span>•</span>
                          <span>{formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">
                          S/ {reservation.price.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => removeReservationFromCart(reservation.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Products in cart */}
              {cart.length > 0 && (
                <>
                  {hasReservations && (
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-4">
                      Productos
                    </p>
                  )}
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
                </>
              )}
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

          {/* Cash Received Input - Only for cash payments */}
          {selectedPayment === "cash" && hasItems && (
            <div className="mb-4 space-y-2">
              <Label htmlFor="cash-received" className="text-sm text-muted-foreground">
                Monto recibido
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  S/
                </span>
                <Input
                  id="cash-received"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="pl-8 text-right font-semibold"
                />
              </div>
              {cashReceived && parseFloat(cashReceived) >= total && (
                <div className="flex justify-between items-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-sm text-green-600 font-medium">Vuelto:</span>
                  <span className="text-lg font-bold text-green-600">
                    S/ {(parseFloat(cashReceived) - total).toFixed(2)}
                  </span>
                </div>
              )}
              {cashReceived && parseFloat(cashReceived) > 0 && parseFloat(cashReceived) < total && (
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-sm text-red-600">
                    Falta: S/ {(total - parseFloat(cashReceived)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Totals */}
          <div className="space-y-2 text-sm">
            {/* Show breakdown for combined sales */}
            {isCombinedSale && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Reservas</span>
                  <span>S/ {reservationsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Productos (inc. IGV)</span>
                  <span>S/ {productTotal.toFixed(2)}</span>
                </div>
                <Separator />
              </>
            )}
            {/* Show product breakdown only */}
            {hasProducts && !isCombinedSale && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IGV (18%)</span>
                  <span>S/ {tax.toFixed(2)}</span>
                </div>
                <Separator />
              </>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            className={cn(
              "mt-4 w-full",
              isCredit && hasProducts ? "bg-amber-600 hover:bg-amber-700" : "btn-gradient"
            )}
            size="lg"
            disabled={
              !hasItems || 
              !selectedPayment || 
              !activeSession || 
              processing || 
              (isCredit && !selectedCustomer)
            }
            onClick={handleProcessSale}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : isCombinedSale ? (
              "Procesar Venta Combinada"
            ) : hasReservations ? (
              `Cobrar Reserva${reservationCart.length > 1 ? 's' : ''}`
            ) : isCredit ? (
              "Registrar Crédito"
            ) : (
              "Procesar Venta"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
