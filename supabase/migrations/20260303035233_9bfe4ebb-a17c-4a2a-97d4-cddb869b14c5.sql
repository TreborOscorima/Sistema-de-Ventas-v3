
-- Create a SECURITY DEFINER function for onboarding that handles everything in one transaction
CREATE OR REPLACE FUNCTION public.onboard_company(
  _company_name text,
  _branch_name text,
  _branch_address text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _company_id uuid;
  _branch_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check user doesn't already have a company
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'User already belongs to a company';
  END IF;

  -- Create company
  INSERT INTO companies (name)
  VALUES (_company_name)
  RETURNING id INTO _company_id;

  -- Assign owner role
  INSERT INTO user_roles (user_id, company_id, role)
  VALUES (_user_id, _company_id, 'owner');

  -- Create branch
  INSERT INTO branches (company_id, name, address)
  VALUES (_company_id, _branch_name, _branch_address)
  RETURNING id INTO _branch_id;

  -- Assign user to branch
  INSERT INTO branch_users (user_id, branch_id)
  VALUES (_user_id, _branch_id);

  RETURN json_build_object(
    'company_id', _company_id,
    'branch_id', _branch_id
  );
END;
$$;
