

## Fase 3: Admin + Automations

### Summary

Replace all 5 admin placeholder pages with functional CRUD interfaces, and build the automation engine (automation rules management UI + a `run-automation` edge function).

---

### 1. Admin Users (`/admin/users`)

- List all profiles with role, organization, BU, active status
- Query: `profiles` joined with `user_roles`, `organizations`, `business_units`
- Actions: invite new user (creates auth user + profile + role), edit role, toggle active
- **Migration needed**: Add INSERT policy on `profiles` for admin role (currently missing -- only UPDATE own is allowed). Add INSERT/UPDATE policies on `message_templates` and `start_forms` for admin/enablement.

### 2. Admin Business Units (`/admin/business-units`)

- List BUs with organization name, slug, active status, pipeline count
- Actions: create BU, edit name/slug, toggle active
- **Migration needed**: Add INSERT/UPDATE policies on `business_units` for admin/enablement

### 3. Admin Pipelines + Phases + Fields (`/admin/pipelines`)

- Accordion/expandable list of pipelines grouped by BU
- Each pipeline expands to show:
  - **Phases**: sortable list, add/edit phase name, toggle is_final
  - **Fields**: table of pipeline_fields, add/edit field (label, key, type, required, phase_id, visible flags, options)
- Uses existing INSERT/UPDATE RLS policies on `pipelines`, `pipeline_phases`, `pipeline_fields` (admin/enablement allowed)

### 4. Admin Automations (`/admin/automations`)

- List automation_rules grouped by pipeline
- Each rule shows: trigger_type, conditions, actions, active toggle
- Create/edit dialog with:
  - Pipeline selector
  - Trigger type (card_created, phase_enter, delay_elapsed, meeting_finished)
  - Conditions JSON editor (simplified key-value form)
  - Actions JSON editor (channel, template_id, delay_days)
  - Active toggle
- View automation_runs logs per rule
- Uses existing INSERT/UPDATE RLS policies on `automation_rules`

### 5. Admin Integrations (`/admin/integrations`)

- List integration_connections with provider, status, last_sync
- Add/edit connection (provider selector, config fields)
- Uses existing INSERT/UPDATE RLS policies on `integration_connections`

### 6. Database Migrations

Single migration to add missing RLS policies:

```sql
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
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','enablement']));

CREATE POLICY bu_update ON public.business_units
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','enablement']))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','enablement']));

-- Allow admin/enablement to manage message templates
CREATE POLICY msg_templates_insert ON public.message_templates
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','enablement']));

CREATE POLICY msg_templates_update ON public.message_templates
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','enablement']))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','enablement']));

-- Allow admin/enablement to manage start forms
CREATE POLICY start_forms_insert ON public.start_forms
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','enablement']));

CREATE POLICY start_forms_update ON public.start_forms
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin','enablement']))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','enablement']));
```

### 7. Edge Function: `run-automation`

- Receives `{ card_id, trigger_type }` 
- Queries matching active `automation_rules` for the card's pipeline
- Evaluates conditions against card data
- Executes actions (logs to `automation_runs`, prepares message_deliveries)
- For delay-based actions, records `automation_runs` with status `pending` for the nightly cron to pick up later
- Uses service role key internally

### 8. New Hooks

- `useAdminUsers` -- CRUD profiles + user_roles
- `useAdminBUs` -- CRUD business_units
- `useAdminPipelines` -- CRUD pipelines, phases, fields
- `useAutomationRules` -- CRUD automation_rules + read automation_runs

### Files

**New/Rewritten pages:**
- `src/pages/admin/Users.tsx`
- `src/pages/admin/BusinessUnits.tsx`
- `src/pages/admin/PipelinesConfig.tsx`
- `src/pages/admin/AutomationRules.tsx`
- `src/pages/admin/Integrations.tsx`

**New hooks:**
- `src/hooks/useAdminUsers.ts`
- `src/hooks/useAdminBUs.ts`
- `src/hooks/useAdminPipelines.ts`
- `src/hooks/useAutomationRules.ts`

**New edge function:**
- `supabase/functions/run-automation/index.ts`

**Migration:**
- One migration adding missing INSERT/UPDATE RLS policies

