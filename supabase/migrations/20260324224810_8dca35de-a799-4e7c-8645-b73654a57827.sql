
CREATE TABLE public.start_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schema JSONB DEFAULT '{"fields":[]}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.start_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read start_forms" ON public.start_forms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert start_forms" ON public.start_forms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update start_forms" ON public.start_forms FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
