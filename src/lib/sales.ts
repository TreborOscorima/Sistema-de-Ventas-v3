import { supabase } from '@/integrations/supabase/client';
import { createBalanceMovement } from '@/lib/customer-movements';

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Sale {
  id: string;
  user_id: string;
  session_id: string | null;
  customer_name: string | null;
  payment_method: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Category[];
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data as unknown as Product[];
}

export async function createSale(
  userId: string,
  sessionId: string | null,
  items: CartItem[],
  paymentMethod: string,
  customerName?: string,
  customerId?: string,
  isCredit?: boolean
): Promise<Sale> {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  // Create the sale
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      user_id: userId,
      session_id: sessionId,
      customer_name: customerName || null,
      customer_id: customerId || null,
      payment_method: paymentMethod,
      subtotal,
      tax,
      total,
      status: 'completed'
    })
    .select()
    .single();

  if (saleError) throw saleError;

  // Create sale items
  const saleItems = items.map(item => ({
    sale_id: sale.id,
    product_id: item.id,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems);

  if (itemsError) throw itemsError;

  // Update stock for each product
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.id)
      .maybeSingle();
    
    if (product) {
      await supabase
        .from('products')
        .update({ stock: product.stock - item.quantity })
        .eq('id', item.id);
    }
  }

  // If sale is on credit, update customer balance and record movement
  if (isCredit && customerId) {
    const { data: customer } = await supabase
      .from('customers')
      .select('balance')
      .eq('id', customerId)
      .maybeSingle();
    
    if (customer) {
      const newBalance = customer.balance - total;
      await supabase
        .from('customers')
        .update({ balance: newBalance })
        .eq('id', customerId);
      
      // Record the balance movement
      await createBalanceMovement(
        userId,
        customerId,
        'credit_sale',
        -total,
        newBalance,
        sale.id,
        `Venta a crédito - S/ ${total.toFixed(2)}`
      );
    }
  }

  return sale as Sale;
}

export async function getSales(userId: string, limit = 50): Promise<Sale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Sale[];
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  const { data, error } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', saleId);

  if (error) throw error;
  return data as SaleItem[];
}

export function mapPaymentMethod(method: string): 'cash' | 'card' | 'transfer' | 'yape' | 'plin' | 'other' {
  const mapping: Record<string, 'cash' | 'card' | 'transfer' | 'yape' | 'plin' | 'other'> = {
    'cash': 'cash',
    'card': 'card',
    'yape': 'yape',
    'plin': 'plin',
    'transfer': 'transfer'
  };
  return mapping[method] || 'other';
}
