
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.org_type AS ENUM ('hq', 'franchise');
CREATE TYPE public.app_role AS ENUM ('admin', 'enablement', 'head', 'closer', 'sdr', 'bdr');
CREATE TYPE public.field_type AS ENUM ('text', 'number', 'email', 'textarea', 'select', 'date', 'phone');
CREATE TYPE public.automation_trigger AS ENUM ('phase_change', 'field_update', 'time_based', 'lead_created');
CREATE TYPE public.message_channel AS ENUM ('email', 'whatsapp');
CREATE TYPE public.pipeline_audience AS ENUM ('internal', 'franchise');

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.org_type NOT NULL DEFAULT 'hq',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read organizations" ON public.organizations FOR SELECT TO authenticated USING (true);

-- ============================================================
-- BUSINESS_UNITS
-- ============================================================
CREATE TABLE public.business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read BUs" ON public.business_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert BUs" ON public.business_units FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update BUs" ON public.business_units FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  organization_id UUID REFERENCES public.organizations(id),
  business_unit_id UUID REFERENCES public.business_units(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());
CREATE POLICY "Service can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- USER_ROLES
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (true);

-- ============================================================
-- has_role function (security definer)
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================================
-- PIPELINES
-- ============================================================
CREATE TABLE public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_unit_id UUID NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  audience public.pipeline_audience NOT NULL DEFAULT 'internal',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read pipelines" ON public.pipelines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert pipelines" ON public.pipelines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update pipelines" ON public.pipelines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- PIPELINE_PHASES
-- ============================================================
CREATE TABLE public.pipeline_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_final BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pipeline_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read phases" ON public.pipeline_phases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert phases" ON public.pipeline_phases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update phases" ON public.pipeline_phases FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- PIPELINE_FIELDS
-- ============================================================
CREATE TABLE public.pipeline_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  key TEXT NOT NULL,
  type public.field_type NOT NULL DEFAULT 'text',
  required BOOLEAN NOT NULL DEFAULT false,
  phase_id UUID REFERENCES public.pipeline_phases(id) ON DELETE SET NULL,
  visible_on_card BOOLEAN NOT NULL DEFAULT true,
  visible_on_start_form BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pipeline_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read fields" ON public.pipeline_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fields" ON public.pipeline_fields FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fields" ON public.pipeline_fields FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- LEADS
-- ============================================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  company_name TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update leads" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- CARDS
-- ============================================================
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  current_phase_id UUID NOT NULL REFERENCES public.pipeline_phases(id),
  owner_profile_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'open',
  origin TEXT NOT NULL DEFAULT 'manual',
  contract_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read cards" ON public.cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cards" ON public.cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cards" ON public.cards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- CARD_FIELD_VALUES
-- ============================================================
CREATE TABLE public.card_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  pipeline_field_id UUID NOT NULL REFERENCES public.pipeline_fields(id) ON DELETE CASCADE,
  value JSONB,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.card_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read card values" ON public.card_field_values FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert card values" ON public.card_field_values FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update card values" ON public.card_field_values FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ACTIVITIES
-- ============================================================
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- AUTOMATION_RULES
-- ============================================================
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  trigger_type public.automation_trigger NOT NULL,
  conditions JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read rules" ON public.automation_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert rules" ON public.automation_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update rules" ON public.automation_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- AUTOMATION_RUNS
-- ============================================================
CREATE TABLE public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  card_id UUID,
  status TEXT NOT NULL DEFAULT 'success',
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_message TEXT
);
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read runs" ON public.automation_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert runs" ON public.automation_runs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- MESSAGE_TEMPLATES
-- ============================================================
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel public.message_channel NOT NULL DEFAULT 'email',
  category TEXT NOT NULL DEFAULT '',
  subject TEXT,
  body TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read templates" ON public.message_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert templates" ON public.message_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update templates" ON public.message_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- MEETING_RECORDS
-- ============================================================
CREATE TABLE public.meeting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT '',
  meeting_url TEXT,
  external_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meeting_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read meetings" ON public.meeting_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert meetings" ON public.meeting_records FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- INTEGRATION_CONNECTIONS
-- ============================================================
CREATE TABLE public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read integrations" ON public.integration_connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert integrations" ON public.integration_connections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update integrations" ON public.integration_connections FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- CONTRACTS
-- ============================================================
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  content JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read contracts" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contracts" ON public.contracts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
