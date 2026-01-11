-- Add user_id column to categories table
ALTER TABLE public.categories 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to courts table
ALTER TABLE public.courts 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to products table
ALTER TABLE public.products 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing overly permissive policies on categories
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;

-- Drop existing overly permissive policies on courts
DROP POLICY IF EXISTS "Authenticated users can manage courts" ON public.courts;
DROP POLICY IF EXISTS "Authenticated users can view courts" ON public.courts;

-- Drop existing overly permissive policies on products
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;

-- Create new user-specific RLS policies for categories
CREATE POLICY "Users can view their own categories" 
ON public.categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
ON public.categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
ON public.categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create new user-specific RLS policies for courts
CREATE POLICY "Users can view their own courts" 
ON public.courts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own courts" 
ON public.courts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courts" 
ON public.courts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courts" 
ON public.courts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create new user-specific RLS policies for products
CREATE POLICY "Users can view their own products" 
ON public.products 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
ON public.products 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
ON public.products 
FOR DELETE 
USING (auth.uid() = user_id);