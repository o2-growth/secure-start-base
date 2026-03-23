
-- ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'enablement', 'head', 'closer', 'sdr', 'bdr');
CREATE TYPE public.org_type AS ENUM ('hq', 'franchise');
CREATE TYPE public.card_status AS ENUM ('open', 'won', 'lost', 'archived');
CREATE TYPE public.card_origin AS ENUM ('manual', 'automation', 'meeting', 'api');
CREATE TYPE public.activity_type AS ENUM ('note', 'email', 'whatsapp', 'meeting', 'move', 'contract', 'system');
CREATE TYPE public.automation_trigger AS ENUM ('card_created', 'phase_enter', 'delay_elapsed', 'meeting_finished');
CREATE TYPE public.automation_run_status AS ENUM ('pending', 'running', 'success', 'failed');
CREATE TYPE public.message_channel AS ENUM ('email', 'whatsapp');
CREATE TYPE public.message_category AS ENUM ('transactional', 'followup');
CREATE TYPE public.pipeline_audience AS ENUM ('internal', 'franchise');
CREATE TYPE public.contract_status AS ENUM ('draft', 'pending_signature', 'signed', 'cancelled');
CREATE TYPE public.meeting_provider AS ENUM ('google_meet', 'elephan');
CREATE TYPE public.integration_provider AS ENUM ('brevo', 'whatsapp_official', 'google_meet', 'elephan', 'contracts');
CREATE TYPE public.field_type AS ENUM ('text', 'number', 'email', 'phone', 'date', 'select', 'multiselect', 'textarea', 'checkbox', 'url');

-- UTILITY FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. ORGANIZATIONS
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type org_type NOT NULL DEFAULT 'hq',
  parent_org_id UUID REFERENCES public.organizations(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. BUSINESS UNITS
CREATE TABLE public.business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  business_unit_id UUID REFERENCES public.business_units(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. PIPELINES
CREATE TABLE public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  audience pipeline_audience NOT NULL DEFAULT 'internal',
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

-- 6. PIPELINE PHASES
CREATE TABLE public.pipeline_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_final BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pipeline_phases ENABLE ROW LEVEL SECURITY;

-- 7. PIPELINE FIELDS
CREATE TABLE public.pipeline_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.pipeline_phases(id),
  label TEXT NOT NULL,
  key TEXT NOT NULL,
  type field_type NOT NULL DEFAULT 'text',
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB,
  validation_rules JSONB,
  visible_on_start_form BOOLEAN NOT NULL DEFAULT false,
  visible_on_card BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pipeline_fields ENABLE ROW LEVEL SECURITY;

-- 8. START FORMS
CREATE TABLE public.start_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schema JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.start_forms ENABLE ROW LEVEL SECURITY;

-- 9. LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  company_name TEXT,
  source TEXT,
  dedupe_hash TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 10. CARDS
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id),
  current_phase_id UUID NOT NULL REFERENCES public.pipeline_phases(id),
  owner_profile_id UUID REFERENCES public.profiles(id),
  status card_status NOT NULL DEFAULT 'open',
  origin card_origin NOT NULL DEFAULT 'manual',
  contract_status contract_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. CARD FIELD VALUES
CREATE TABLE public.card_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  pipeline_field_id UUID NOT NULL REFERENCES public.pipeline_fields(id),
  value JSONB,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.card_field_values ENABLE ROW LEVEL SECURITY;

-- 12. ACTIVITIES
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 13. AUTOMATION RULES
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  trigger_type automation_trigger NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- 14. AUTOMATION RUNS
CREATE TABLE public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id),
  card_id UUID NOT NULL REFERENCES public.cards(id),
  status automation_run_status NOT NULL DEFAULT 'pending',
  input_payload JSONB,
  output_payload JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- 15. MESSAGE TEMPLATES
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id UUID REFERENCES public.business_units(id),
  channel message_channel NOT NULL,
  category message_category NOT NULL DEFAULT 'transactional',
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  variables JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- 16. MESSAGE DELIVERIES
CREATE TABLE public.message_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id),
  channel message_channel NOT NULL,
  template_id UUID REFERENCES public.message_templates(id),
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT
);
ALTER TABLE public.message_deliveries ENABLE ROW LEVEL SECURITY;

-- 17. MEETING RECORDS
CREATE TABLE public.meeting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id),
  provider meeting_provider NOT NULL,
  meeting_external_id TEXT,
  meeting_url TEXT,
  transcript_text TEXT,
  recording_url TEXT,
  summary TEXT,
  ai_extract JSONB,
  occurred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meeting_records ENABLE ROW LEVEL SECURITY;

-- 18. CONTRACTS
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id),
  provider TEXT NOT NULL DEFAULT 'lovable',
  external_contract_id TEXT,
  status contract_status NOT NULL DEFAULT 'draft',
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 19. INTEGRATION CONNECTIONS
CREATE TABLE public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider integration_provider NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  encrypted_config TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

-- INDEXES
CREATE INDEX idx_profiles_auth_user ON public.profiles(auth_user_id);
CREATE INDEX idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX idx_profiles_bu ON public.profiles(business_unit_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_bu_org ON public.business_units(organization_id);
CREATE INDEX idx_pipelines_bu ON public.pipelines(business_unit_id);
CREATE INDEX idx_phases_pipeline ON public.pipeline_phases(pipeline_id);
CREATE INDEX idx_fields_pipeline ON public.pipeline_fields(pipeline_id);
CREATE INDEX idx_leads_org ON public.leads(organization_id);
CREATE INDEX idx_leads_bu ON public.leads(business_unit_id);
CREATE INDEX idx_leads_dedupe ON public.leads(dedupe_hash);
CREATE INDEX idx_cards_pipeline ON public.cards(pipeline_id);
CREATE INDEX idx_cards_phase ON public.cards(current_phase_id);
CREATE INDEX idx_cards_owner ON public.cards(owner_profile_id);
CREATE INDEX idx_cards_lead ON public.cards(lead_id);
CREATE INDEX idx_card_values_card ON public.card_field_values(card_id);
CREATE INDEX idx_activities_card ON public.activities(card_id);
CREATE INDEX idx_automation_rules_pipeline ON public.automation_rules(pipeline_id);
CREATE INDEX idx_automation_runs_card ON public.automation_runs(card_id);
CREATE INDEX idx_message_deliveries_card ON public.message_deliveries(card_id);
CREATE INDEX idx_meeting_records_card ON public.meeting_records(card_id);
CREATE INDEX idx_contracts_card ON public.contracts(card_id);

-- SECURITY DEFINER FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile(_user_id UUID)
RETURNS TABLE(profile_id UUID, organization_id UUID, business_unit_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.organization_id, p.business_unit_id FROM public.profiles p WHERE p.auth_user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = _user_id AND organization_id = _org_id)
$$;

CREATE OR REPLACE FUNCTION public.user_can_access_bu(_user_id UUID, _bu_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = _user_id
    AND (
      public.has_any_role(_user_id, ARRAY['admin'::app_role, 'enablement'::app_role])
      OR p.business_unit_id = _bu_id
    )
  )
$$;

-- RLS POLICIES

-- ORGANIZATIONS
CREATE POLICY "org_select" ON public.organizations FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_belongs_to_org(auth.uid(), id));

-- BUSINESS UNITS
CREATE POLICY "bu_select" ON public.business_units FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), id));

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role])
    OR auth_user_id = auth.uid()
  );
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

-- USER ROLES
CREATE POLICY "roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR user_id = auth.uid());
CREATE POLICY "roles_insert_admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_update_admin" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_delete_admin" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- PIPELINES
CREATE POLICY "pipelines_select" ON public.pipelines FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), business_unit_id));
CREATE POLICY "pipelines_insert_admin" ON public.pipelines FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]));
CREATE POLICY "pipelines_update_admin" ON public.pipelines FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]));

-- PIPELINE PHASES
CREATE POLICY "phases_select" ON public.pipeline_phases FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pipelines pl WHERE pl.id = pipeline_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));
CREATE POLICY "phases_insert_admin" ON public.pipeline_phases FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]));
CREATE POLICY "phases_update_admin" ON public.pipeline_phases FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]));

-- PIPELINE FIELDS
CREATE POLICY "fields_select" ON public.pipeline_fields FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pipelines pl WHERE pl.id = pipeline_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));
CREATE POLICY "fields_insert_admin" ON public.pipeline_fields FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]));
CREATE POLICY "fields_update_admin" ON public.pipeline_fields FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]));

-- START FORMS
CREATE POLICY "start_forms_select" ON public.start_forms FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pipelines pl WHERE pl.id = pipeline_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));

-- LEADS
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR (public.user_belongs_to_org(auth.uid(), organization_id) AND public.user_can_access_bu(auth.uid(), business_unit_id)));
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id) AND public.user_can_access_bu(auth.uid(), business_unit_id) AND created_by = auth.uid());

-- CARDS (no delete!)
CREATE POLICY "cards_select" ON public.cards FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pipelines pl WHERE pl.id = pipeline_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));
CREATE POLICY "cards_insert" ON public.cards FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.pipelines pl WHERE pl.id = pipeline_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));
CREATE POLICY "cards_update" ON public.cards FOR UPDATE TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role])
    OR (
      EXISTS (SELECT 1 FROM public.pipelines pl WHERE pl.id = pipeline_id AND public.user_can_access_bu(auth.uid(), pl.business_unit_id))
      AND (NOT public.has_role(auth.uid(), 'closer') OR owner_profile_id = (SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid() LIMIT 1))
    )
  );

-- CARD FIELD VALUES
CREATE POLICY "cfv_select" ON public.card_field_values FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cards c JOIN public.pipelines pl ON pl.id = c.pipeline_id WHERE c.id = card_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));
CREATE POLICY "cfv_insert" ON public.card_field_values FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.cards c JOIN public.pipelines pl ON pl.id = c.pipeline_id WHERE c.id = card_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));
CREATE POLICY "cfv_update" ON public.card_field_values FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cards c JOIN public.pipelines pl ON pl.id = c.pipeline_id WHERE c.id = card_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));

-- ACTIVITIES
CREATE POLICY "activities_select" ON public.activities FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cards c JOIN public.pipelines pl ON pl.id = c.pipeline_id WHERE c.id = card_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));
CREATE POLICY "activities_insert" ON public.activities FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.cards c JOIN public.pipelines pl ON pl.id = c.pipeline_id WHERE c.id = card_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));

-- AUTOMATION RULES
CREATE POLICY "auto_rules_select" ON public.automation_rules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pipelines pl WHERE pl.id = pipeline_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));
CREATE POLICY "auto_rules_insert" ON public.automation_rules FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]));
CREATE POLICY "auto_rules_update" ON public.automation_rules FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]));

-- AUTOMATION RUNS
CREATE POLICY "auto_runs_select" ON public.automation_runs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cards c JOIN public.pipelines pl ON pl.id = c.pipeline_id WHERE c.id = card_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));

-- MESSAGE TEMPLATES
CREATE POLICY "msg_templates_select" ON public.message_templates FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR (business_unit_id IS NOT NULL AND public.user_can_access_bu(auth.uid(), business_unit_id)) OR business_unit_id IS NULL);

-- MESSAGE DELIVERIES
CREATE POLICY "msg_deliveries_select" ON public.message_deliveries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cards c JOIN public.pipelines pl ON pl.id = c.pipeline_id WHERE c.id = card_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));

-- MEETING RECORDS
CREATE POLICY "meetings_select" ON public.meeting_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cards c JOIN public.pipelines pl ON pl.id = c.pipeline_id WHERE c.id = card_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));

-- CONTRACTS
CREATE POLICY "contracts_select" ON public.contracts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cards c JOIN public.pipelines pl ON pl.id = c.pipeline_id WHERE c.id = card_id AND (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]) OR public.user_can_access_bu(auth.uid(), pl.business_unit_id))));
CREATE POLICY "contracts_insert" ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'closer') OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]));

-- INTEGRATION CONNECTIONS (admin only)
CREATE POLICY "integrations_select" ON public.integration_connections FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'enablement'::app_role]));
CREATE POLICY "integrations_insert_admin" ON public.integration_connections FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "integrations_update_admin" ON public.integration_connections FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
