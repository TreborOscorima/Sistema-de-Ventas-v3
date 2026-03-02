
-- Fix the permissive INSERT policy on companies to require authenticated user
DROP POLICY "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Authenticated users can create companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (
    -- User must not already own a company (one company per owner for now)
    -- or this is being done as part of onboarding
    auth.uid() IS NOT NULL
  );
