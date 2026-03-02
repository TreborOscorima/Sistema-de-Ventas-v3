
-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'cashier');

-- 2. Companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  tax_id text,
  tax_rate numeric NOT NULL DEFAULT 0,
  tax_name text NOT NULL DEFAULT 'IVA',
  show_tax_on_receipt boolean NOT NULL DEFAULT true,
  receipt_header text,
  receipt_footer text,
  show_logo_on_receipt boolean NOT NULL DEFAULT false,
  thermal_paper_size text NOT NULL DEFAULT '80mm',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Branches table
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. User roles table (user <-> company with role)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- 5. Branch users table (user <-> branch assignment)
CREATE TABLE public.branch_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, branch_id)
);

-- 6. Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 7. Function to check if user belongs to a company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- 8. Function to check if user belongs to a branch
CREATE OR REPLACE FUNCTION public.user_belongs_to_branch(_user_id uuid, _branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.branch_users
    WHERE user_id = _user_id AND branch_id = _branch_id AND is_active = true
  )
$$;

-- 9. Function to get user role in a company
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid, _company_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id AND company_id = _company_id
  LIMIT 1
$$;

-- 10. Enable RLS on all new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_users ENABLE ROW LEVEL SECURITY;

-- 11. RLS for companies
CREATE POLICY "Users can view their companies"
  ON public.companies FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), id));

CREATE POLICY "Owners can update their companies"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid(), id) = 'owner');

CREATE POLICY "Authenticated users can create companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true);

-- 12. RLS for branches
CREATE POLICY "Users can view branches of their companies"
  ON public.branches FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Owners can insert branches"
  ON public.branches FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role(auth.uid(), company_id) = 'owner');

CREATE POLICY "Owners can update branches"
  ON public.branches FOR UPDATE TO authenticated
  USING (public.get_user_role(auth.uid(), company_id) = 'owner');

CREATE POLICY "Owners can delete branches"
  ON public.branches FOR DELETE TO authenticated
  USING (public.get_user_role(auth.uid(), company_id) = 'owner');

-- 13. RLS for user_roles
CREATE POLICY "Users can view roles in their companies"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Owners can manage roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid(), company_id) = 'owner'
    OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE company_id = user_roles.company_id)
  );

CREATE POLICY "Owners can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.get_user_role(auth.uid(), company_id) = 'owner');

-- 14. RLS for branch_users
CREATE POLICY "Users can view branch assignments in their companies"
  ON public.branch_users FOR SELECT TO authenticated
  USING (public.user_belongs_to_branch(auth.uid(), branch_id) 
    OR EXISTS (
      SELECT 1 FROM public.branches b
      JOIN public.user_roles ur ON ur.company_id = b.company_id
      WHERE b.id = branch_users.branch_id AND ur.user_id = auth.uid() AND ur.role = 'owner'
    ));

CREATE POLICY "Owners can manage branch assignments"
  ON public.branch_users FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.branches b
    JOIN public.user_roles ur ON ur.company_id = b.company_id
    WHERE b.id = branch_users.branch_id AND ur.user_id = auth.uid() AND ur.role = 'owner'
  ) OR branch_users.user_id = auth.uid());

CREATE POLICY "Owners can delete branch assignments"
  ON public.branch_users FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.branches b
    JOIN public.user_roles ur ON ur.company_id = b.company_id
    WHERE b.id = branch_users.branch_id AND ur.user_id = auth.uid() AND ur.role = 'owner'
  ));

-- 15. Add branch_id to all operational tables
ALTER TABLE public.products ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.suppliers ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.purchases ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.courts ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.reservations ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE;
ALTER TABLE public.cashbox_sessions ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE;

-- 16. Updated_at triggers for new tables
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
