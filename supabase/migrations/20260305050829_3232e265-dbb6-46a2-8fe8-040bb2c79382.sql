
-- Create user_permissions table for customizable module access
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, module)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Owners can manage permissions
CREATE POLICY "Owners can manage permissions" ON public.user_permissions
FOR ALL TO authenticated
USING (get_user_role(auth.uid(), company_id) = 'owner'::app_role)
WITH CHECK (get_user_role(auth.uid(), company_id) = 'owner'::app_role);

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions" ON public.user_permissions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Function to check module access
CREATE OR REPLACE FUNCTION public.user_has_module_access(_user_id uuid, _company_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Owners and admins always have full access
    CASE 
      WHEN get_user_role(_user_id, _company_id) IN ('owner', 'admin') THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.user_permissions
        WHERE user_id = _user_id AND company_id = _company_id AND module = _module
      )
    END
$$;
