
-- Fix: The INSERT policy on companies is RESTRICTIVE, which means it's ANDed with other policies.
-- Since there are no PERMISSIVE policies, all access is denied.
-- Drop and recreate as PERMISSIVE.

DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Authenticated users can create companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also fix the user_roles INSERT policy - same issue
DROP POLICY IF EXISTS "Owners can manage roles" ON public.user_roles;
CREATE POLICY "Owners can manage roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    (get_user_role(auth.uid(), company_id) = 'owner'::app_role)
    OR
    -- Allow first role assignment (onboarding: no roles exist yet for this user)
    (user_id = auth.uid() AND NOT EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid()
    ))
  );

-- Fix branches INSERT - owner needs to be able to create first branch during onboarding
DROP POLICY IF EXISTS "Owners can insert branches" ON public.branches;
CREATE POLICY "Owners can insert branches"
  ON public.branches FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid(), company_id) = 'owner'::app_role);

-- Fix branch_users INSERT
DROP POLICY IF EXISTS "Owners can manage branch assignments" ON public.branch_users;
CREATE POLICY "Owners can manage branch assignments"
  ON public.branch_users FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM branches b
      JOIN user_roles ur ON ur.company_id = b.company_id
      WHERE b.id = branch_users.branch_id
        AND ur.user_id = auth.uid()
        AND ur.role = 'owner'::app_role
    ))
    OR (user_id = auth.uid())
  );
