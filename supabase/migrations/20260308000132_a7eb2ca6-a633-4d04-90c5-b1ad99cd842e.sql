
-- Add currency to companies
ALTER TABLE public.companies ADD COLUMN currency text NOT NULL DEFAULT 'PEN';

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  key text NOT NULL,
  icon text NOT NULL DEFAULT 'banknote',
  is_active boolean NOT NULL DEFAULT true,
  is_custom boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, key)
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS: company members can view
CREATE POLICY "Users can view company payment methods"
ON public.payment_methods FOR SELECT
TO authenticated
USING (user_belongs_to_company(auth.uid(), company_id));

-- RLS: owners can manage
CREATE POLICY "Owners can insert payment methods"
ON public.payment_methods FOR INSERT
TO authenticated
WITH CHECK (get_user_role(auth.uid(), company_id) = 'owner');

CREATE POLICY "Owners can update payment methods"
ON public.payment_methods FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid(), company_id) = 'owner');

CREATE POLICY "Owners can delete payment methods"
ON public.payment_methods FOR DELETE
TO authenticated
USING (get_user_role(auth.uid(), company_id) = 'owner');

-- Function to seed default payment methods for a company
CREATE OR REPLACE FUNCTION public.seed_default_payment_methods(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.payment_methods (company_id, name, key, icon, is_active, is_custom, sort_order)
  VALUES
    (_company_id, 'Efectivo', 'cash', 'banknote', true, false, 1),
    (_company_id, 'Tarjeta', 'card', 'credit-card', true, false, 2),
    (_company_id, 'Transferencia', 'transfer', 'arrow-right-left', true, false, 3),
    (_company_id, 'Yape', 'yape', 'smartphone', true, false, 4),
    (_company_id, 'Plin', 'plin', 'smartphone', true, false, 5)
  ON CONFLICT (company_id, key) DO NOTHING;
END;
$$;
