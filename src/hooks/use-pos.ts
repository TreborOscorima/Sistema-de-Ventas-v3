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
import { Reservation, getReservations, updateReservationStatus } from '@/lib/reservations';
import { supabase } from '@/integrations/supabase/client';

export interface ReservationCartItem {
  id: string;
  type: 'reservation';
  courtName: string;
  customerName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}

export function usePOS() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSession, addMovement, refresh: refreshCashbox } = useCashbox();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [reservationCart, setReservationCart] = useState<ReservationCartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCredit, setIsCredit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [cats, prods, custs, reservs] = await Promise.all([
        getCategories(),
        getProducts(),
        getCustomers(user.id),
        getReservations()
      ]);
      setCategories(cats);
      setProducts(prods);
      setCustomers(custs);
      // Filter reservations that are pending or confirmed (not paid yet)
      const pending = reservs.filter(r => r.status === 'pending' || r.status === 'confirmed');
      setPendingReservations(pending);
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
    setReservationCart([]);
    setSelectedPayment(null);
    setSelectedCustomer(null);
    setIsCredit(false);
  };

  const addReservationToCart = (reservation: Reservation) => {
    // Check if already in cart
    if (reservationCart.some(r => r.id === reservation.id)) {
      toast({
        title: 'Ya agregada',
        description: 'Esta reserva ya está en el carrito',
        variant: 'default'
      });
      return;
    }

    setReservationCart(prev => [...prev, {
      id: reservation.id,
      type: 'reservation',
      courtName: reservation.court?.name || 'Cancha',
      customerName: reservation.customer_name,
      date: reservation.reservation_date,
      startTime: reservation.start_time,
      endTime: reservation.end_time,
      price: Number(reservation.total_amount)
    }]);
  };

  const removeReservationFromCart = (reservationId: string) => {
    setReservationCart(prev => prev.filter(r => r.id !== reservationId));
  };

  const processCombinedSale = async (customerName?: string) => {
    if (!user || (cart.length === 0 && reservationCart.length === 0) || !selectedPayment) {
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
      
      let saleResult = null;
      const paymentMethodForCashbox = mapPaymentMethod(selectedPayment);
      
      // Process product sale if there are products
      if (cart.length > 0) {
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
          await addMovement(
            'sale',
            sale.total,
            `Venta #${sale.id.slice(0, 8)}`,
            paymentMethodForCashbox
          );
        }
        
        saleResult = sale;
      }

      // Process reservations if there are any
      if (reservationCart.length > 0) {
        for (const reservation of reservationCart) {
          await updateReservationStatus(reservation.id, 'completed');
          
          await addMovement(
            'sale',
            reservation.price,
            `Reserva: ${reservation.courtName} - ${reservation.customerName}`,
            paymentMethodForCashbox
          );
        }
      }

      const totalAmount = total;
      const itemCount = cart.length + reservationCart.length;
      
      toast({
        title: isCredit && cart.length > 0 ? 'Venta combinada a crédito' : 'Venta procesada',
        description: isCredit && cart.length > 0
          ? `Crédito de S/ ${productTotal.toFixed(2)} para ${selectedCustomer?.name}. Reservas: S/ ${reservationsTotal.toFixed(2)}`
          : `Total: S/ ${totalAmount.toFixed(2)} (${itemCount} items)`
      });

      clearCart();
      await loadData();
      await refreshCashbox();
      
      return saleResult || { total: totalAmount };
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

  const productSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const productTax = productSubtotal * 0.18;
  const productTotal = productSubtotal + productTax;

  // Reservation totals (no tax applied as it's already included)
  const reservationsTotal = reservationCart.reduce((sum, r) => sum + r.price, 0);

  // Combined totals
  const subtotal = productSubtotal + reservationsTotal;
  const tax = productTax;
  const total = productTotal + reservationsTotal;

  // Getters for receipt data
  const getReceiptData = () => ({
    products: [...cart],
    reservations: [...reservationCart],
    productSubtotal,
    productTax,
    productTotal,
    reservationsTotal,
    grandTotal: total,
  });

  return {
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
    productSubtotal,
    productTax,
    reservationsTotal,
    setSelectedPayment,
    setSelectedCustomer,
    setIsCredit,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    processSale: processCombinedSale,
    addReservationToCart,
    removeReservationFromCart,
    getReceiptData,
    refresh: loadData
  };
}
