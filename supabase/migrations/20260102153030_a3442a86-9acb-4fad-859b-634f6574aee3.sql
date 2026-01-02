-- Create customer balance movements table
CREATE TABLE public.customer_balance_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'credit_sale', 'payment', 'adjustment_credit', 'adjustment_debit'
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  reference_id UUID, -- sale_id for credit sales
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_balance_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own movements"
ON public.customer_balance_movements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movements"
ON public.customer_balance_movements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_customer_balance_movements_customer_id ON public.customer_balance_movements(customer_id);
CREATE INDEX idx_customer_balance_movements_created_at ON public.customer_balance_movements(created_at DESC);