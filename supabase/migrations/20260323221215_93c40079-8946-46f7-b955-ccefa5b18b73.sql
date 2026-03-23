
-- UPDATE policy on contracts for admin/enablement/closer
CREATE POLICY contracts_update ON public.contracts
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role, 'closer'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role, 'closer'::app_role]));
