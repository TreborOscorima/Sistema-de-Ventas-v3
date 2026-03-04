-- Allow owners to update branch_users (e.g., deactivate employees)
CREATE POLICY "Owners can update branch assignments"
ON public.branch_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM branches b
    JOIN user_roles ur ON ur.company_id = b.company_id
    WHERE b.id = branch_users.branch_id
      AND ur.user_id = auth.uid()
      AND ur.role = 'owner'
  )
);