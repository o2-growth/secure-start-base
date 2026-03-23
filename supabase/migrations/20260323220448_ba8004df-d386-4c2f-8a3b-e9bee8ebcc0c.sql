
-- Allow admin to insert profiles (for user invites)
CREATE POLICY profiles_insert_admin ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow admin to update any profile
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow admin/enablement to manage BUs
CREATE POLICY bu_insert ON public.business_units
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'enablement'::app_role]));

CREATE POLICY bu_update ON public.business_units
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role,'enablement'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'enablement'::app_role]));

-- Allow admin/enablement to manage message templates
CREATE POLICY msg_templates_insert ON public.message_templates
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'enablement'::app_role]));

CREATE POLICY msg_templates_update ON public.message_templates
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role,'enablement'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'enablement'::app_role]));

-- Allow admin/enablement to manage start forms
CREATE POLICY start_forms_insert ON public.start_forms
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'enablement'::app_role]));

CREATE POLICY start_forms_update ON public.start_forms
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role,'enablement'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'enablement'::app_role]));

-- Allow admin/enablement to insert automation_runs (for the edge function with user token)
CREATE POLICY auto_runs_insert ON public.automation_runs
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role,'enablement'::app_role]));
