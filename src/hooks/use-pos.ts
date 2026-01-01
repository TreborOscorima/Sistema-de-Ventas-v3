import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCashbox } from '@/hooks/use-cashbox';
import {
  Category,
  Product,
  CartItem,
  getCategories,
  getProducts,
  createSale,
  mapPaymentMethod
} from '@/lib/sales';
import { Customer, getCustomers } from '@/lib/customers';

export function usePOS() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSession, addMovement, refresh: refreshCashbox } = useCashbox();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCredit, setIsCredit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [cats, prods, custs] = await Promise.all([
        getCategories(),
        getProducts(),
        getCustomers(user.id)
      ]);
      setCategories(cats);
      setProducts(prods);
      setCustomers(custs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addToCart = (product: Product) => {
    const stock = product.stock;
    const currentInCart = cart.find(item => item.id === product.id)?.quantity || 0;
    
    if (currentInCart >= stock) {
      toast({
        title: 'Stock insuficiente',
        description: `Solo hay ${stock} unidades disponibles`,
        variant: 'destructive'
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: Number(product.price), 
        quantity: 1 
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      
      const newQuantity = item.quantity + delta;
      
      if (newQuantity <= 0) {
        return prev.filter(i => i.id !== id);
      }
      
      if (product && newQuantity > product.stock) {
        toast({
          title: 'Stock insuficiente',
          description: `Solo hay ${product.stock} unidades disponibles`,
          variant: 'destructive'
        });
        return prev;
      }
      
      return prev.map(i =>
        i.id === id ? { ...i, quantity: newQuantity } : i
      );
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedPayment(null);
    setSelectedCustomer(null);
    setIsCredit(false);
  };

  const processSale = async (customerName?: string) => {
    if (!user || cart.length === 0 || !selectedPayment) {
      return null;
    }

    if (!activeSession) {
      toast({
        title: 'Caja cerrada',
        description: 'Debes abrir la caja antes de procesar ventas',
        variant: 'destructive'
      });
      return null;
    }

    // Credit sales require a selected customer
    if (isCredit && !selectedCustomer) {
      toast({
        title: 'Cliente requerido',
        description: 'Debes seleccionar un cliente para ventas a crédito',
        variant: 'destructive'
      });
      return null;
    }

    try {
      setProcessing(true);
      
      const sale = await createSale(
        user.id,
        activeSession.id,
        cart,
        selectedPayment,
        selectedCustomer?.name || customerName,
        selectedCustomer?.id,
        isCredit
      );

      // Register movement in cashbox (only if not credit)
      if (!isCredit) {
        const paymentMethodForCashbox = mapPaymentMethod(selectedPayment);
        await addMovement(
          'sale',
          sale.total,
          `Venta #${sale.id.slice(0, 8)}`,
          paymentMethodForCashbox
        );
      }

      toast({
        title: isCredit ? 'Venta a crédito registrada' : 'Venta procesada',
        description: isCredit 
          ? `Crédito de S/ ${sale.total.toFixed(2)} para ${selectedCustomer?.name}`
          : `Total: S/ ${sale.total.toFixed(2)}`
      });

      clearCart();
      await loadData(); // Refresh products and customers
      await refreshCashbox();
      
      return sale;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al procesar venta';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return {
    categories,
    products,
    customers,
    cart,
    selectedPayment,
    selectedCustomer,
    isCredit,
    loading,
    processing,
    activeSession,
    subtotal,
    tax,
    total,
    setSelectedPayment,
    setSelectedCustomer,
    setIsCredit,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    processSale,
    refresh: loadData
  };
}
