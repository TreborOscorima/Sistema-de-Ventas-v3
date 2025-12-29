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

export function usePOS() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSession, addMovement, refresh: refreshCashbox } = useCashbox();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        getCategories(),
        getProducts()
      ]);
      setCategories(cats);
      setProducts(prods);
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
  }, [toast]);

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

    try {
      setProcessing(true);
      
      const sale = await createSale(
        user.id,
        activeSession.id,
        cart,
        selectedPayment,
        customerName
      );

      // Register movement in cashbox
      const paymentMethodForCashbox = mapPaymentMethod(selectedPayment);
      await addMovement(
        'sale',
        sale.total,
        `Venta #${sale.id.slice(0, 8)}`,
        paymentMethodForCashbox
      );

      toast({
        title: 'Venta procesada',
        description: `Total: S/ ${sale.total.toFixed(2)}`
      });

      clearCart();
      await loadData(); // Refresh products to get updated stock
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
    clearCart,
    processSale,
    refresh: loadData
  };
}
