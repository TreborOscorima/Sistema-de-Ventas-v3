-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.cashbox_sessions(id),
  customer_name TEXT,
  payment_method TEXT NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale_items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Categories: anyone authenticated can view and manage
CREATE POLICY "Authenticated users can view categories"
ON public.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Products: anyone authenticated can view and manage
CREATE POLICY "Authenticated users can view products"
ON public.products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage products"
ON public.products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Sales: users can only access their own sales
CREATE POLICY "Users can view their own sales"
ON public.sales FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales"
ON public.sales FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
ON public.sales FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Sale items: users can access items from their own sales
CREATE POLICY "Users can view their own sale items"
ON public.sale_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_items.sale_id 
    AND sales.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own sale items"
ON public.sale_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_items.sale_id 
    AND sales.user_id = auth.uid()
  )
);

-- Trigger for updating products updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial categories
INSERT INTO public.categories (name, slug) VALUES
  ('Bebidas', 'bebidas'),
  ('Snacks', 'snacks'),
  ('Lácteos', 'lacteos'),
  ('Limpieza', 'limpieza'),
  ('Otros', 'otros');

-- Insert initial products
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Agua San Luis 500ml', 1.5, 48, id FROM public.categories WHERE slug = 'bebidas';
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Coca Cola 500ml', 2.5, 36, id FROM public.categories WHERE slug = 'bebidas';
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Gatorade Limón 500ml', 3.0, 24, id FROM public.categories WHERE slug = 'bebidas';
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Inca Kola 500ml', 2.5, 32, id FROM public.categories WHERE slug = 'bebidas';
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Snickers Bar', 2.0, 20, id FROM public.categories WHERE slug = 'snacks';
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Galletas Oreo', 2.0, 30, id FROM public.categories WHERE slug = 'snacks';
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Papitas Lays', 2.5, 25, id FROM public.categories WHERE slug = 'snacks';
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Chocolate Sublime', 1.5, 40, id FROM public.categories WHERE slug = 'snacks';
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Leche Gloria 1L', 4.5, 18, id FROM public.categories WHERE slug = 'lacteos';
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Yogurt Laive', 3.0, 15, id FROM public.categories WHERE slug = 'lacteos';
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Detergente Ace 500g', 8.0, 12, id FROM public.categories WHERE slug = 'limpieza';
INSERT INTO public.products (name, price, stock, category_id) 
SELECT 'Jabón Bolívar', 2.5, 20, id FROM public.categories WHERE slug = 'limpieza';