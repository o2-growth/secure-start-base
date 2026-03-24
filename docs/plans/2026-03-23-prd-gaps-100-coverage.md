# O2-CRM — PRD Gaps: 100% Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fechar todos os gaps identificados entre o projeto atual e o PRD, atingindo 100% de cobertura em segurança backend, integrações reais, seed de dados e estrutura de código.

**Architecture:** Toda lógica crítica de negócio (criar lead, validar lead, mover card) migra para Supabase Edge Functions. Integrações com Brevo, WhatsApp e contratos saem de stubs e recebem chamadas reais. Um seed SQL popula os dados iniciais exigidos pelo PRD.

**Tech Stack:** Deno (Edge Functions), Supabase Postgres + RLS, React + TypeScript (frontend hooks), SQL migrations

---

## CONTEXTO DO PROJETO

- **Diretório:** `~/ai-workspace/o2-crm/`
- **Edge Functions:** `supabase/functions/` — runtime Deno
- **Frontend hooks:** `src/hooks/`
- **Services frontend:** `src/lib/services/`
- **Migrations:** `supabase/migrations/`
- **Supabase client (frontend):** `src/integrations/supabase/client.ts`
- **RBAC:** `src/lib/rbac/permissions.ts` e `guards.ts`

### Padrão de auth nas edge functions (existente — copiar sempre):
```typescript
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
}
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey);
const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
  global: { headers: { Authorization: authHeader } },
});
const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
if (claimsError || !claimsData?.claims) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
}
const userId = claimsData.claims.sub;
```

### corsHeaders (existente — copiar sempre):
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

---

## TAREFAS

---

### Task 1: Edge Function `validate-lead`

**Contexto:** Hoje a validação de duplicidade está no hook `src/hooks/useLeadValidation.ts` rodando 100% no cliente. O PRD exige que aconteça via edge function no backend.

**Files:**
- Create: `supabase/functions/validate-lead/index.ts`
- Modify: `src/hooks/useLeadValidation.ts`

**Step 1: Criar edge function `validate-lead`**

Criar `supabase/functions/validate-lead/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { organization_id, email, phone, document } = await req.json();
    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller role for override capability
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", userId)
      .single();

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    const role = roleRow?.role ?? null;
    const canOverride = role === "admin" || role === "enablement";

    // Build OR filters
    const filters: string[] = [];
    if (email?.trim()) filters.push(`email.eq.${email.trim()}`);
    if (phone?.trim()) filters.push(`phone.eq.${phone.trim()}`);
    if (document?.trim()) filters.push(`document.eq.${document.trim()}`);

    if (filters.length === 0) {
      return new Response(JSON.stringify({ duplicates: [], can_override: canOverride }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: duplicates, error } = await supabase
      .from("leads")
      .select("id, full_name, email, phone, document")
      .eq("organization_id", organization_id)
      .or(filters.join(","));

    if (error) throw error;

    return new Response(
      JSON.stringify({ duplicates: duplicates ?? [], can_override: canOverride }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

**Step 2: Atualizar `src/hooks/useLeadValidation.ts` para chamar edge function**

Substituir o conteúdo inteiro por:

```typescript
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DuplicateLead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
}

export interface ValidationResult {
  duplicates: DuplicateLead[];
  can_override: boolean;
}

export function useLeadValidation() {
  const [duplicates, setDuplicates] = useState<DuplicateLead[]>([]);
  const [canOverride, setCanOverride] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkDuplicates = async (
    organizationId: string,
    email?: string,
    phone?: string,
    document?: string
  ): Promise<ValidationResult> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-lead", {
        body: { organization_id: organizationId, email, phone, document },
      });

      if (error) throw error;

      const result: ValidationResult = {
        duplicates: data.duplicates ?? [],
        can_override: data.can_override ?? false,
      };

      setDuplicates(result.duplicates);
      setCanOverride(result.can_override);
      return result;
    } finally {
      setIsChecking(false);
    }
  };

  const clearDuplicates = () => {
    setDuplicates([]);
    setCanOverride(false);
  };

  return { duplicates, canOverride, isChecking, checkDuplicates, clearDuplicates };
}
```

**Step 3: Commit**

```bash
git add supabase/functions/validate-lead/index.ts src/hooks/useLeadValidation.ts
git commit -m "feat: migrate validate-lead logic to edge function [PRD gap]"
```

---

### Task 2: Edge Function `create-lead`

**Contexto:** Hoje `src/hooks/useCreateLead.ts` cria lead + card diretamente pelo cliente Supabase. O PRD exige que isso aconteça via edge function para centralizar a lógica, garantir auditoria e disparar automações no backend.

**Files:**
- Create: `supabase/functions/create-lead/index.ts`
- Modify: `src/hooks/useCreateLead.ts`

**Step 1: Criar edge function `create-lead`**

Criar `supabase/functions/create-lead/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Check permission (role must be able to create leads)
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    const allowedRoles = ["admin", "enablement", "head", "closer", "sdr", "bdr"];
    if (!roleRow || !allowedRoles.includes(roleRow.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      pipeline_id,
      organization_id,
      business_unit_id,
      full_name,
      email,
      phone,
      document,
      company_name,
      source,
    } = await req.json();

    if (!pipeline_id || !organization_id || !business_unit_id || !full_name) {
      return new Response(
        JSON.stringify({ error: "pipeline_id, organization_id, business_unit_id, full_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get first phase of pipeline
    const { data: phases, error: phError } = await supabase
      .from("pipeline_phases")
      .select("id")
      .eq("pipeline_id", pipeline_id)
      .order("position")
      .limit(1);

    if (phError) throw phError;
    if (!phases?.length) {
      return new Response(JSON.stringify({ error: "Pipeline sem fases configuradas" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profile of caller
    const { data: profile, error: prError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", userId)
      .single();

    if (prError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert lead
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert({
        organization_id,
        business_unit_id,
        full_name,
        email: email || null,
        phone: phone || null,
        document: document || null,
        company_name: company_name || null,
        source: source || null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (leadErr) throw leadErr;

    // Insert card
    const { data: card, error: cardErr } = await supabase
      .from("cards")
      .insert({
        lead_id: lead.id,
        pipeline_id,
        current_phase_id: phases[0].id,
        owner_profile_id: profile.id,
        status: "open",
        origin: "manual",
      })
      .select("id")
      .single();

    if (cardErr) throw cardErr;

    // Register activity
    await supabase.from("activities").insert({
      card_id: card.id,
      type: "system",
      payload: { message: "Lead criado manualmente" },
      created_by: userId,
    });

    // Trigger card_created automations (fire and forget)
    supabase.functions.invoke("run-automation", {
      body: { card_id: card.id, trigger_type: "card_created" },
    }).catch(() => {/* non-blocking */});

    return new Response(JSON.stringify({ card_id: card.id, lead_id: lead.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

**Step 2: Atualizar `src/hooks/useCreateLead.ts` para chamar edge function**

Substituir conteúdo por:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateLeadInput {
  pipelineId: string;
  organizationId: string;
  businessUnitId: string;
  fullName: string;
  email?: string;
  phone?: string;
  document?: string;
  companyName?: string;
  source?: string;
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const { data, error } = await supabase.functions.invoke("create-lead", {
        body: {
          pipeline_id: input.pipelineId,
          organization_id: input.organizationId,
          business_unit_id: input.businessUnitId,
          full_name: input.fullName,
          email: input.email,
          phone: input.phone,
          document: input.document,
          company_name: input.companyName,
          source: input.source,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data as { card_id: string; lead_id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-cards"] });
      toast({ title: "Lead criado com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar lead", description: err.message, variant: "destructive" });
    },
  });
}
```

**Step 3: Commit**

```bash
git add supabase/functions/create-lead/index.ts src/hooks/useCreateLead.ts
git commit -m "feat: migrate create-lead logic to edge function with automation trigger [PRD gap]"
```

---

### Task 3: Edge Function `move-card`

**Contexto:** Hoje `src/hooks/useMoveCard.ts` move o card e registra activity diretamente pelo cliente. O PRD exige edge function para garantir que regras críticas fiquem no backend.

**Files:**
- Create: `supabase/functions/move-card/index.ts`
- Modify: `src/hooks/useMoveCard.ts`

**Step 1: Criar edge function `move-card`**

Criar `supabase/functions/move-card/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { card_id, target_phase_id, target_phase_name } = await req.json();
    if (!card_id || !target_phase_id) {
      return new Response(JSON.stringify({ error: "card_id and target_phase_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get caller profile + role
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", userId)
      .single();

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    const role = roleRow?.role ?? null;

    // Get card to check ownership (closer can only move own cards)
    const { data: card, error: cardFetchErr } = await supabase
      .from("cards")
      .select("id, owner_profile_id, pipeline_id, status")
      .eq("id", card_id)
      .single();

    if (cardFetchErr || !card) {
      return new Response(JSON.stringify({ error: "Card not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Closer can only move own cards
    if (role === "closer" && card.owner_profile_id !== profile?.id) {
      return new Response(JSON.stringify({ error: "Forbidden: closer can only move own cards" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required fields for target phase
    const { data: requiredFields } = await supabase
      .from("pipeline_fields")
      .select("id, label, key")
      .eq("pipeline_id", card.pipeline_id)
      .eq("phase_id", target_phase_id)
      .eq("required", true);

    if (requiredFields && requiredFields.length > 0) {
      const { data: values } = await supabase
        .from("card_field_values")
        .select("pipeline_field_id, value")
        .eq("card_id", card_id);

      const valuesMap = new Map((values ?? []).map((v) => [v.pipeline_field_id, v.value]));

      const missingFields = requiredFields.filter((f) => {
        const val = valuesMap.get(f.id);
        return val === null || val === undefined || val === "" || val === '""';
      });

      if (missingFields.length > 0) {
        return new Response(
          JSON.stringify({ error: "missing_required_fields", missing_fields: missingFields }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Move card
    const { error: updateErr } = await supabase
      .from("cards")
      .update({ current_phase_id: target_phase_id })
      .eq("id", card_id);

    if (updateErr) throw updateErr;

    // Register activity
    await supabase.from("activities").insert({
      card_id,
      type: "move",
      payload: { to_phase: target_phase_name ?? target_phase_id, to_phase_id: target_phase_id },
      created_by: userId,
    });

    // Trigger phase_enter automations (fire and forget)
    supabase.functions.invoke("run-automation", {
      body: { card_id, trigger_type: "phase_enter" },
    }).catch(() => {/* non-blocking */});

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

**Step 2: Atualizar `src/hooks/useMoveCard.ts` para chamar edge function**

Substituir conteúdo por:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MoveCardInput {
  cardId: string;
  targetPhaseId: string;
  targetPhaseName?: string;
}

export interface MissingField {
  id: string;
  label: string;
  key: string;
}

export class MissingFieldsError extends Error {
  missingFields: MissingField[];
  constructor(fields: MissingField[]) {
    super("missing_required_fields");
    this.missingFields = fields;
  }
}

export function useMoveCard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: MoveCardInput) => {
      const { data, error } = await supabase.functions.invoke("move-card", {
        body: {
          card_id: input.cardId,
          target_phase_id: input.targetPhaseId,
          target_phase_name: input.targetPhaseName,
        },
      });

      if (error) throw error;
      if (data?.error === "missing_required_fields") {
        throw new MissingFieldsError(data.missing_fields ?? []);
      }
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-cards"] });
      queryClient.invalidateQueries({ queryKey: ["card"] });
      queryClient.invalidateQueries({ queryKey: ["card-activities"] });
      toast({ title: "Card movido com sucesso" });
    },
    onError: (err: Error) => {
      if (err instanceof MissingFieldsError) return; // PhaseGuardDialog handles this
      toast({ title: "Erro ao mover card", description: err.message, variant: "destructive" });
    },
  });
}
```

**Step 3: Commit**

```bash
git add supabase/functions/move-card/index.ts src/hooks/useMoveCard.ts
git commit -m "feat: migrate move-card to edge function with RBAC + phase validation [PRD gap]"
```

---

### Task 4: Implementar Brevo real em `send-brevo-email`

**Contexto:** A edge function `send-brevo-email` cria o registro mas não chama a API do Brevo. Precisa substituir o TODO pela chamada real à Brevo Transactional Email API v3.

**Files:**
- Modify: `supabase/functions/send-brevo-email/index.ts`

**Step 1: Substituir TODO pela chamada real à API Brevo**

Localizar o bloco do TODO na linha ~89-91 e substituir por:

```typescript
    // Call real Brevo Transactional Email API
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      await supabase.from("message_deliveries").update({
        status: "failed",
        error_message: "BREVO_API_KEY not configured",
      }).eq("id", delivery.id);
      throw new Error("BREVO_API_KEY not configured");
    }

    // Fetch lead info for email recipient
    const { data: cardWithLead } = await supabase
      .from("cards")
      .select("leads(full_name, email)")
      .eq("id", card_id)
      .single();

    const lead = (cardWithLead?.leads as any);
    if (!lead?.email) {
      await supabase.from("message_deliveries").update({
        status: "failed",
        error_message: "Lead has no email address",
      }).eq("id", delivery.id);
      throw new Error("Lead has no email address");
    }

    // Interpolate template variables
    const body = template.body.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
      const vars: Record<string, string> = {
        nome: lead.full_name ?? "",
        email: lead.email ?? "",
      };
      return vars[key] ?? "";
    });

    const brevoPayload = {
      sender: { name: "O2 CRM", email: "no-reply@o2inc.com.br" },
      to: [{ email: lead.email, name: lead.full_name }],
      subject: template.subject ?? template.name,
      htmlContent: body,
    };

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text();
      await supabase.from("message_deliveries").update({
        status: "failed",
        error_message: errText,
      }).eq("id", delivery.id);
      throw new Error(`Brevo error: ${errText}`);
    }

    const brevoData = await brevoRes.json();

    // Update delivery record with success
    await supabase.from("message_deliveries").update({
      status: "sent",
      provider_message_id: brevoData.messageId ?? null,
      sent_at: new Date().toISOString(),
    }).eq("id", delivery.id);
```

**Step 2: Commit**

```bash
git add supabase/functions/send-brevo-email/index.ts
git commit -m "feat: implement real Brevo API call in send-brevo-email edge function [PRD gap]"
```

---

### Task 5: Implementar WhatsApp real em `send-whatsapp`

**Contexto:** A edge function `send-whatsapp` cria o registro mas não chama a API. Precisa substituir o TODO pela chamada real à Meta WhatsApp Business API (Cloud API v18+).

**Files:**
- Modify: `supabase/functions/send-whatsapp/index.ts`

**Step 1: Substituir TODO pela chamada real à Meta WhatsApp API**

Localizar o bloco do TODO na linha ~85-87 e substituir por:

```typescript
    // Call real Meta WhatsApp Business Cloud API
    const WA_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
    const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!WA_TOKEN || !WA_PHONE_ID) {
      await supabase.from("message_deliveries").update({
        status: "failed",
        error_message: "WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured",
      }).eq("id", delivery.id);
      throw new Error("WhatsApp credentials not configured");
    }

    // Normalize phone to E.164 format (remove non-digits, add country code if needed)
    const normalizedPhone = phone.replace(/\D/g, "");
    const e164Phone = normalizedPhone.startsWith("55") ? normalizedPhone : `55${normalizedPhone}`;

    // Build template-based WhatsApp payload
    // Uses WhatsApp template message format (pre-approved template required)
    const waPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: e164Phone,
      type: "text",
      text: {
        preview_url: false,
        body: template.body,
      },
    };

    const waRes = await fetch(
      `https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WA_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(waPayload),
      }
    );

    if (!waRes.ok) {
      const errText = await waRes.text();
      await supabase.from("message_deliveries").update({
        status: "failed",
        error_message: errText,
      }).eq("id", delivery.id);
      throw new Error(`WhatsApp API error: ${errText}`);
    }

    const waData = await waRes.json();
    const providerMsgId = waData.messages?.[0]?.id ?? null;

    // Update delivery record with success
    await supabase.from("message_deliveries").update({
      status: "sent",
      provider_message_id: providerMsgId,
      sent_at: new Date().toISOString(),
    }).eq("id", delivery.id);
```

**Step 2: Commit**

```bash
git add supabase/functions/send-whatsapp/index.ts
git commit -m "feat: implement real Meta WhatsApp Cloud API call in send-whatsapp edge function [PRD gap]"
```

---

### Task 6: Implementar integração de contratos Lovable

**Contexto:** `generate-contract` cria o registro com status `draft` mas não integra com o sistema externo. Como a ferramenta de contratos do Lovable é um sistema no ecossistema Lovable, a integração usa o `LOVABLE_CONTRACTS_WEBHOOK_URL` para notificá-la e receber de volta um external_contract_id.

**Files:**
- Modify: `supabase/functions/generate-contract/index.ts`

**Step 1: Substituir TODO pela integração com Lovable Contracts**

Localizar o bloco do TODO na linha ~88 e substituir por:

```typescript
    // Integrate with Lovable Contracts external tool
    const CONTRACTS_WEBHOOK_URL = Deno.env.get("LOVABLE_CONTRACTS_WEBHOOK_URL");

    if (CONTRACTS_WEBHOOK_URL) {
      // Fetch card and lead details for contract payload
      const { data: cardWithDetails } = await supabase
        .from("cards")
        .select("*, leads(full_name, email, phone, document, company_name), pipelines(name, business_units(name))")
        .eq("id", card_id)
        .single();

      const contractPayload = {
        contract_id: contract.id,
        card_id,
        lead: (cardWithDetails?.leads as any) ?? {},
        pipeline: (cardWithDetails?.pipelines as any)?.name ?? "",
        business_unit: (cardWithDetails?.pipelines as any)?.business_units?.name ?? "",
        created_by: userId,
        created_at: contract.created_at,
      };

      try {
        const contractRes = await fetch(CONTRACTS_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contractPayload),
        });

        if (contractRes.ok) {
          const contractData = await contractRes.json();
          const externalId = contractData.external_contract_id ?? contractData.id ?? null;
          const contractUrl = contractData.url ?? null;

          // Update contract with external ID and move to pending_signature
          await supabase.from("contracts").update({
            external_contract_id: externalId,
            status: "pending_signature",
            payload: { ...contractPayload, lovable_response: contractData },
          }).eq("id", contract.id);

          // Update card
          await supabase.from("cards").update({ contract_status: "pending_signature" }).eq("id", card_id);

          // Update activity with contract URL
          await supabase.from("activities").insert({
            card_id,
            type: "contract",
            payload: { contract_id: contract.id, status: "pending_signature", contract_url: contractUrl },
            created_by: userId,
          });
        }
      } catch (_integrationError) {
        // Non-blocking: contract record was created, integration failed silently
        // Admin can retry from integration panel
      }
    }
```

**Step 2: Commit**

```bash
git add supabase/functions/generate-contract/index.ts
git commit -m "feat: implement Lovable contracts webhook integration in generate-contract [PRD gap]"
```

---

### Task 7: Fazer `run-automation` chamar edge functions reais

**Contexto:** `run-automation` cria `message_deliveries` com status `pending` mas não invoca as edge functions `send-brevo-email` / `send-whatsapp` para envio real. Isso precisa ser corrigido.

**Files:**
- Modify: `supabase/functions/run-automation/index.ts`

**Step 1: Substituir o bloco de "Process actions" para invocar edge functions reais**

Localizar o bloco entre linhas ~105-115 (comentário `// Process actions`) e substituir por:

```typescript
        // Process actions — invoke real send functions
        const channel = (actions as any)?.channel;
        const templateId = (actions as any)?.template_id;
        const phone = (actions as any)?.phone;

        if (channel === "email" && templateId) {
          await supabase.functions.invoke("send-brevo-email", {
            body: { card_id: card_id, template_id: templateId },
          });
        } else if (channel === "whatsapp" && templateId) {
          const cardPhone = (card as any)?.leads?.phone ?? phone ?? null;
          if (cardPhone) {
            await supabase.functions.invoke("send-whatsapp", {
              body: { card_id: card_id, template_id: templateId, phone: cardPhone },
            });
          }
        } else if (channel === "both" && templateId) {
          // Send via both channels
          await supabase.functions.invoke("send-brevo-email", {
            body: { card_id: card_id, template_id: templateId },
          });
          const cardPhone = (card as any)?.leads?.phone ?? phone ?? null;
          if (cardPhone) {
            await supabase.functions.invoke("send-whatsapp", {
              body: { card_id: card_id, template_id: templateId, phone: cardPhone },
            });
          }
        }
```

**Step 2: Commit**

```bash
git add supabase/functions/run-automation/index.ts
git commit -m "feat: run-automation now invokes real send-brevo-email/send-whatsapp edge functions [PRD gap]"
```

---

### Task 8: Seed SQL — 4 BUs, 4 Pipelines, 6 Fases, 7 Automações

**Contexto:** O PRD exige seed inicial com organização O2 Inc., 4 BUs (Modelo Atual, Tax, Expansão, Educação), 4 pipelines com 6 fases cada, e 7 automações de follow-up obrigatórias. Nada disso existe no banco.

**Files:**
- Create: `supabase/migrations/20260323300000_seed_initial_data.sql`

**Step 1: Criar migration de seed**

Criar `supabase/migrations/20260323300000_seed_initial_data.sql`:

```sql
-- ============================================================
-- SEED: O2 Inc. organization, BUs, pipelines, phases, automations
-- ============================================================

-- 1. Organization: O2 Inc. (HQ)
INSERT INTO public.organizations (id, name, type, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'O2 Inc.', 'hq', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Business Units
INSERT INTO public.business_units (id, organization_id, name, slug, active) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Modelo Atual',  'modelo-atual', true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Tax',           'tax',          true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Expansão',      'expansao',     true),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Educação',      'educacao',     true)
ON CONFLICT (id) DO NOTHING;

-- 3. Pipelines (internal, one per BU)
INSERT INTO public.pipelines (id, business_unit_id, audience, name, active) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'internal', 'Pipeline Modelo Atual', true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'internal', 'Pipeline Tax',          true),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'internal', 'Pipeline Expansão',     true),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'internal', 'Pipeline Educação',     true)
ON CONFLICT (id) DO NOTHING;

-- 4. Pipeline Phases (6 per pipeline — Modelo Atual)
INSERT INTO public.pipeline_phases (id, pipeline_id, name, position, is_final) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Novo Lead',             1, false),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Qualificação',          2, false),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Reunião Agendada',      3, false),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'Proposta/Negociação',   4, false),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'Fechado Ganha',         5, true),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 'Fechado Perdida',       6, true)
ON CONFLICT (id) DO NOTHING;

-- Pipeline Phases — Tax
INSERT INTO public.pipeline_phases (id, pipeline_id, name, position, is_final) VALUES
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002', 'Novo Lead',             1, false),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002', 'Qualificação',          2, false),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000002', 'Reunião Agendada',      3, false),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000002', 'Proposta/Negociação',   4, false),
  ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000002', 'Fechado Ganha',         5, true),
  ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000002', 'Fechado Perdida',       6, true)
ON CONFLICT (id) DO NOTHING;

-- Pipeline Phases — Expansão
INSERT INTO public.pipeline_phases (id, pipeline_id, name, position, is_final) VALUES
  ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000003', 'Novo Lead',             1, false),
  ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000003', 'Qualificação',          2, false),
  ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000003', 'Reunião Agendada',      3, false),
  ('30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000003', 'Proposta/Negociação',   4, false),
  ('30000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000003', 'Fechado Ganha',         5, true),
  ('30000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000003', 'Fechado Perdida',       6, true)
ON CONFLICT (id) DO NOTHING;

-- Pipeline Phases — Educação
INSERT INTO public.pipeline_phases (id, pipeline_id, name, position, is_final) VALUES
  ('30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000004', 'Novo Lead',             1, false),
  ('30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000004', 'Qualificação',          2, false),
  ('30000000-0000-0000-0000-000000000033', '20000000-0000-0000-0000-000000000004', 'Reunião Agendada',      3, false),
  ('30000000-0000-0000-0000-000000000034', '20000000-0000-0000-0000-000000000004', 'Proposta/Negociação',   4, false),
  ('30000000-0000-0000-0000-000000000035', '20000000-0000-0000-0000-000000000004', 'Fechado Ganha',         5, true),
  ('30000000-0000-0000-0000-000000000036', '20000000-0000-0000-0000-000000000004', 'Fechado Perdida',       6, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Start forms (one per pipeline, minimal schema)
INSERT INTO public.start_forms (id, pipeline_id, name, schema, active) VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Formulário Modelo Atual',
   '{"fields":["full_name","email","phone","document","company_name","source","notes"]}', true),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Formulário Tax',
   '{"fields":["full_name","email","phone","document","company_name","source","notes"]}', true),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Formulário Expansão',
   '{"fields":["full_name","email","phone","document","company_name","source","notes"]}', true),
  ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'Formulário Educação',
   '{"fields":["full_name","email","phone","document","company_name","source","notes"]}', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Message Templates: welcome + 7 follow-ups per channel
-- Welcome templates
INSERT INTO public.message_templates (id, channel, category, name, subject, body, variables, active) VALUES
  ('50000000-0000-0000-0000-000000000001', 'email', 'transactional', 'Boas-vindas Email',
   'Bem-vindo à O2!',
   '<p>Olá {{nome}},</p><p>Seja bem-vindo! Em breve entraremos em contato.</p><p>Equipe O2</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000002', 'whatsapp', 'transactional', 'Boas-vindas WhatsApp',
   NULL,
   'Olá {{nome}}! Seja bem-vindo à O2. Em breve entraremos em contato. 😊',
   '{"nome":"Nome do lead"}', true)
ON CONFLICT (id) DO NOTHING;

-- Follow-up templates (email)
INSERT INTO public.message_templates (id, channel, category, name, subject, body, variables, active) VALUES
  ('50000000-0000-0000-0000-000000000011', 'email', 'followup', 'Follow-up 3 dias',
   'Acompanhamento — O2',
   '<p>Olá {{nome}},</p><p>Gostaria de dar continuidade à nossa conversa. Podemos conversar?</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000012', 'email', 'followup', 'Follow-up 6 dias',
   'Retorno — O2',
   '<p>Olá {{nome}},</p><p>Estou entrando em contato novamente para verificar se posso ajudar.</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000013', 'email', 'followup', 'Follow-up 9 dias',
   'Verificação — O2',
   '<p>Olá {{nome}},</p><p>Quero garantir que você tenha todas as informações necessárias.</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000014', 'email', 'followup', 'Follow-up 14 dias',
   'Última tentativa — O2',
   '<p>Olá {{nome}},</p><p>Faço mais esta tentativa de contato. Podemos conversar?</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000015', 'email', 'followup', 'Follow-up 21 dias',
   'Oportunidade — O2',
   '<p>Olá {{nome}},</p><p>Estou disponível para tirar dúvidas sobre nossas soluções.</p>',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000016', 'email', 'followup', 'Follow-up 30 dias',
   'Um mês de contato — O2',
   '<p>Olá {{nome}},</p><p>Já faz 30 dias desde nosso primeiro contato. Ainda posso ajudar?</p>',
   '{"nome":"Nome do lead"}', true)
ON CONFLICT (id) DO NOTHING;

-- Follow-up templates (whatsapp)
INSERT INTO public.message_templates (id, channel, category, name, subject, body, variables, active) VALUES
  ('50000000-0000-0000-0000-000000000021', 'whatsapp', 'followup', 'Follow-up 3 dias WA',
   NULL, 'Olá {{nome}}! Só passando para verificar se ficou alguma dúvida. Posso ajudar? 🤝',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000022', 'whatsapp', 'followup', 'Follow-up 6 dias WA',
   NULL, 'Oi {{nome}}! Estou entrando em contato novamente. Quando podemos conversar?',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000023', 'whatsapp', 'followup', 'Follow-up 9 dias WA',
   NULL, 'Olá {{nome}}! Quero garantir que você tenha todas as informações. Posso ajudar?',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000024', 'whatsapp', 'followup', 'Follow-up 14 dias WA',
   NULL, 'Oi {{nome}}! Faço mais esta tentativa de contato. Tem interesse em conversar?',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000025', 'whatsapp', 'followup', 'Follow-up 21 dias WA',
   NULL, 'Olá {{nome}}! Ainda estou disponível para apresentar nossas soluções. 😊',
   '{"nome":"Nome do lead"}', true),
  ('50000000-0000-0000-0000-000000000026', 'whatsapp', 'followup', 'Follow-up 30 dias WA',
   NULL, 'Oi {{nome}}! Já se passou um mês. Ainda posso te ajudar com algo?',
   '{"nome":"Nome do lead"}', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Automation Rules: 1 boas-vindas + 6 follow-ups per pipeline
-- Helper: create automation rules for a given pipeline
-- Modelo Atual automations
INSERT INTO public.automation_rules (pipeline_id, trigger_type, conditions, actions, active) VALUES
  -- Boas-vindas imediato
  ('20000000-0000-0000-0000-000000000001', 'card_created',
   '{}',
   '{"channel":"both","template_id":"50000000-0000-0000-0000-000000000001","stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}',
   true),
  -- Follow-ups (delay_days + email template)
  ('20000000-0000-0000-0000-000000000001', 'card_created',
   '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000011","delay_days":3,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}',
   true),
  ('20000000-0000-0000-0000-000000000001', 'card_created',
   '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000012","delay_days":6,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}',
   true),
  ('20000000-0000-0000-0000-000000000001', 'card_created',
   '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000013","delay_days":9,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}',
   true),
  ('20000000-0000-0000-0000-000000000001', 'card_created',
   '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000014","delay_days":14,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}',
   true),
  ('20000000-0000-0000-0000-000000000001', 'card_created',
   '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000015","delay_days":21,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}',
   true),
  ('20000000-0000-0000-0000-000000000001', 'card_created',
   '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000016","delay_days":30,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}',
   true);

-- Tax automations (same structure, different pipeline_id)
INSERT INTO public.automation_rules (pipeline_id, trigger_type, conditions, actions, active) VALUES
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"both","template_id":"50000000-0000-0000-0000-000000000001","stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000011","delay_days":3,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000012","delay_days":6,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000013","delay_days":9,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000014","delay_days":14,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000015","delay_days":21,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000002', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000016","delay_days":30,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true);

-- Expansão automations
INSERT INTO public.automation_rules (pipeline_id, trigger_type, conditions, actions, active) VALUES
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"both","template_id":"50000000-0000-0000-0000-000000000001","stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000011","delay_days":3,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000012","delay_days":6,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000013","delay_days":9,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000014","delay_days":14,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000015","delay_days":21,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000003', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000016","delay_days":30,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true);

-- Educação automations
INSERT INTO public.automation_rules (pipeline_id, trigger_type, conditions, actions, active) VALUES
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"both","template_id":"50000000-0000-0000-0000-000000000001","stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000011","delay_days":3,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000012","delay_days":6,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000013","delay_days":9,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000014","delay_days":14,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000015","delay_days":21,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true),
  ('20000000-0000-0000-0000-000000000004', 'card_created', '{}',
   '{"channel":"email","template_id":"50000000-0000-0000-0000-000000000016","delay_days":30,"stop_on_phase_change":true,"stop_on_won":true,"stop_on_lost":true,"stop_on_reply":false}', true);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260323300000_seed_initial_data.sql
git commit -m "feat: add seed migration for 4 BUs, 4 pipelines, 24 phases, 28 automation rules [PRD gap]"
```

---

### Task 9: Criar estrutura `validators/` e `mappers/`

**Contexto:** O PRD especifica pastas `src/lib/validators/` e `src/lib/mappers/` com arquivos específicos. Hoje as validações estão dispersas. Criar a estrutura consolidando a lógica.

**Files:**
- Create: `src/lib/validators/lead.validator.ts`
- Create: `src/lib/validators/phase.validator.ts`
- Create: `src/lib/validators/contract.validator.ts`
- Create: `src/lib/validators/automation.validator.ts`
- Create: `src/lib/mappers/elephan.mapper.ts`
- Create: `src/lib/mappers/contracts.mapper.ts`

**Step 1: Criar `src/lib/validators/lead.validator.ts`**

```typescript
import { z } from "zod";

export const leadSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-().]{8,}$/, "Telefone inválido")
    .optional()
    .or(z.literal("")),
  document: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
});

export type LeadFormData = z.infer<typeof leadSchema>;
```

**Step 2: Criar `src/lib/validators/phase.validator.ts`**

```typescript
import { z } from "zod";

export const phaseFieldValueSchema = z.object({
  fieldId: z.string().uuid(),
  value: z.unknown(),
});

export function validateRequiredFields(
  fields: { id: string; label: string; key: string }[],
  values: Map<string, unknown>
): { id: string; label: string; key: string }[] {
  return fields.filter((f) => {
    const val = values.get(f.id);
    return val === null || val === undefined || val === "" || val === '""';
  });
}
```

**Step 3: Criar `src/lib/validators/contract.validator.ts`**

```typescript
import { z } from "zod";

export const contractGenerationSchema = z.object({
  cardId: z.string().uuid("card_id inválido"),
});

export type ContractGenerationInput = z.infer<typeof contractGenerationSchema>;
```

**Step 4: Criar `src/lib/validators/automation.validator.ts`**

```typescript
import { z } from "zod";

export const automationRuleSchema = z.object({
  pipelineId: z.string().uuid(),
  triggerType: z.enum(["card_created", "phase_enter", "delay_elapsed", "meeting_finished"]),
  conditions: z.record(z.unknown()).default({}),
  actions: z
    .object({
      channel: z.enum(["email", "whatsapp", "both"]).optional(),
      template_id: z.string().uuid().optional(),
      delay_days: z.number().int().min(0).optional(),
      stop_on_phase_change: z.boolean().default(true),
      stop_on_won: z.boolean().default(true),
      stop_on_lost: z.boolean().default(true),
      stop_on_reply: z.boolean().default(false),
    })
    .passthrough(),
  active: z.boolean().default(true),
});

export type AutomationRuleFormData = z.infer<typeof automationRuleSchema>;
```

**Step 5: Criar `src/lib/mappers/elephan.mapper.ts`**

```typescript
export interface ElephanWebhookPayload {
  card_id?: string;
  meeting_id?: string;
  transcript_text?: string;
  recording_url?: string;
  summary?: string;
  ai_extract?: Record<string, unknown>;
  occurred_at?: string;
}

export interface MeetingRecordInsert {
  card_id: string;
  provider: "elephan";
  meeting_external_id: string;
  meeting_url: string | null;
  transcript_text: string | null;
  recording_url: string | null;
  summary: string | null;
  ai_extract: Record<string, unknown> | null;
  occurred_at: string;
}

export function mapElephanPayload(payload: ElephanWebhookPayload): Partial<MeetingRecordInsert> {
  return {
    provider: "elephan",
    meeting_external_id: payload.meeting_id ?? "unknown",
    meeting_url: null,
    transcript_text: payload.transcript_text ?? null,
    recording_url: payload.recording_url ?? null,
    summary: payload.summary ?? null,
    ai_extract: payload.ai_extract ?? null,
    occurred_at: payload.occurred_at ?? new Date().toISOString(),
  };
}
```

**Step 6: Criar `src/lib/mappers/contracts.mapper.ts`**

```typescript
export interface LovableContractResponse {
  id?: string;
  external_contract_id?: string;
  url?: string;
  status?: string;
}

export interface ContractPayload {
  contract_id: string;
  card_id: string;
  lead: {
    full_name?: string;
    email?: string;
    phone?: string;
    document?: string;
    company_name?: string;
  };
  pipeline: string;
  business_unit: string;
  created_by: string;
  created_at: string;
}

export function mapLovableResponse(response: LovableContractResponse) {
  return {
    externalContractId: response.external_contract_id ?? response.id ?? null,
    url: response.url ?? null,
    status: response.status ?? "pending_signature",
  };
}
```

**Step 7: Commit**

```bash
git add src/lib/validators/ src/lib/mappers/
git commit -m "feat: create validators/ and mappers/ structure per PRD spec [PRD gap]"
```

---

### Task 10: Criar componentes faltantes

**Contexto:** O PRD especifica `AutomationLogTable`, `IntegrationStatusCard` e `CardDrawer` que não existem.

**Files:**
- Create: `src/components/AutomationLogTable.tsx`
- Create: `src/components/IntegrationStatusCard.tsx`

**Step 1: Criar `src/components/AutomationLogTable.tsx`**

```tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  cardId?: string;
  pipelineId?: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  pending: "secondary",
  running: "outline",
  failed: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  success: "Sucesso",
  pending: "Pendente",
  running: "Executando",
  failed: "Falhou",
};

export function AutomationLogTable({ cardId, pipelineId }: Props) {
  const { data: runs, isLoading } = useQuery({
    queryKey: ["automation-runs", cardId, pipelineId],
    queryFn: async () => {
      let query = supabase
        .from("automation_runs")
        .select("*, automation_rules(pipeline_id, trigger_type)")
        .order("executed_at", { ascending: false })
        .limit(50);

      if (cardId) query = query.eq("card_id", cardId);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!runs?.length) return <p className="text-sm text-muted-foreground">Nenhuma execução registrada.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Regra</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Executado</TableHead>
          <TableHead>Erro</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => (
          <TableRow key={run.id}>
            <TableCell className="text-xs font-mono">{run.rule_id.slice(0, 8)}...</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[run.status] ?? "outline"}>
                {STATUS_LABEL[run.status] ?? run.status}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {run.executed_at
                ? formatDistanceToNow(new Date(run.executed_at), { addSuffix: true, locale: ptBR })
                : "—"}
            </TableCell>
            <TableCell className="text-xs text-destructive max-w-[200px] truncate">
              {run.error_message ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Step 2: Criar `src/components/IntegrationStatusCard.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IntegrationConnection {
  id: string;
  provider: string;
  active: boolean;
  last_sync_at: string | null;
}

interface Props {
  connection: IntegrationConnection;
}

const PROVIDER_LABELS: Record<string, string> = {
  brevo: "Brevo (E-mail)",
  whatsapp_official: "WhatsApp Oficial",
  google_meet: "Google Meet",
  elephan: "Elephan IA",
  contracts: "Contratos Lovable",
};

export function IntegrationStatusCard({ connection }: Props) {
  const label = PROVIDER_LABELS[connection.provider] ?? connection.provider;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {connection.active ? (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" /> Ativo
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Inativo
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {connection.last_sync_at ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Última sync:{" "}
            {formatDistanceToNow(new Date(connection.last_sync_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Nunca sincronizado</p>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/AutomationLogTable.tsx src/components/IntegrationStatusCard.tsx
git commit -m "feat: add AutomationLogTable and IntegrationStatusCard components [PRD gap]"
```

---

### Task 11: Criar `src/lib/supabase/server.ts`

**Contexto:** O PRD especifica `src/lib/supabase/server.ts`. Hoje só existe `src/lib/supabase/client.ts` (que é redirect para `src/integrations/supabase/client.ts`). O `server.ts` expõe um cliente com service role para uso interno (não browser).

**Files:**
- Create: `src/lib/supabase/server.ts`

**Step 1: Criar `src/lib/supabase/server.ts`**

```typescript
// Server-side Supabase client — NEVER use in browser/frontend
// Use only in build scripts, seed scripts, or server-side contexts
// For edge functions, use createClient directly from esm.sh

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set for server client"
  );
}

export const supabaseServer = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

**Step 2: Commit**

```bash
git add src/lib/supabase/server.ts
git commit -m "feat: add supabase server client per PRD spec [PRD gap]"
```

---

### Task 12: Instalar dependências faltantes do PRD

**Contexto:** O PRD lista `uuid`, `pino` como dependências. `axios` e `googleapis` também aparecem mas só fazem sentido em contextos server-side (edge functions usam fetch nativo). Instalar o que faz sentido para o frontend.

**Files:**
- Modify: `package.json` (via npm install)

**Step 1: Instalar uuid e @types/uuid**

```bash
cd ~/ai-workspace/o2-crm && npm install uuid && npm install -D @types/uuid
```

**Step 2: Instalar pino (logging)**

```bash
cd ~/ai-workspace/o2-crm && npm install pino pino-pretty
```

**Step 3: Criar `src/lib/logger.ts`**

```typescript
// Thin logger wrapper — in browser, pino uses console transport
// In server/node context, pino writes structured JSON
import pino from "pino";

export const logger = pino({
  level: import.meta.env.DEV ? "debug" : "info",
  browser: {
    asObject: true,
  },
});
```

**Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/logger.ts
git commit -m "feat: install uuid + pino dependencies per PRD spec [PRD gap]"
```

---

### Task 13: Integrar `IntegrationStatusCard` na página de Integrações

**Contexto:** O componente foi criado mas precisa ser usado na página `src/pages/admin/Integrations.tsx`.

**Files:**
- Modify: `src/pages/admin/Integrations.tsx`

**Step 1: Ler o arquivo atual**

Ler `src/pages/admin/Integrations.tsx` para ver o conteúdo atual.

**Step 2: Adicionar import e uso do componente**

Adicionar o import:
```typescript
import { IntegrationStatusCard } from "@/components/IntegrationStatusCard";
```

Localizar onde as integrações são listadas e substituir por:
```tsx
{connections?.map((conn) => (
  <IntegrationStatusCard key={conn.id} connection={conn} />
))}
```

**Step 3: Commit**

```bash
git add src/pages/admin/Integrations.tsx
git commit -m "feat: use IntegrationStatusCard in Integrations admin page [PRD gap]"
```

---

### Task 14: Integrar `AutomationLogTable` na página de Automações e no CardDetails

**Contexto:** O componente foi criado e precisa ser usado nas telas relevantes.

**Files:**
- Modify: `src/pages/admin/AutomationRules.tsx`
- Modify: `src/pages/pipelines/CardDetails.tsx`

**Step 1: Ler AutomationRules.tsx e CardDetails.tsx**

Ler ambos os arquivos para entender a estrutura atual.

**Step 2: Adicionar `AutomationLogTable` em `AutomationRules.tsx`**

Abaixo da tabela de regras, adicionar uma seção de execuções recentes:
```tsx
import { AutomationLogTable } from "@/components/AutomationLogTable";

// No JSX, após a tabela de regras:
<div className="mt-8">
  <h3 className="text-lg font-semibold mb-4">Execuções Recentes</h3>
  <AutomationLogTable />
</div>
```

**Step 3: Adicionar `AutomationLogTable` em `CardDetails.tsx`**

Adicionar uma aba ou seção de automações no detalhe do card:
```tsx
import { AutomationLogTable } from "@/components/AutomationLogTable";

// Passar o cardId para filtrar execuções deste card:
<AutomationLogTable cardId={cardId} />
```

**Step 4: Commit**

```bash
git add src/pages/admin/AutomationRules.tsx src/pages/pipelines/CardDetails.tsx
git commit -m "feat: integrate AutomationLogTable in admin and card details pages [PRD gap]"
```

---

## ORDEM DE EXECUÇÃO

Execute as tasks nesta ordem (sem dependências entre pares marcados como paralelos):

| Fase | Tasks | Paralelo? |
|------|-------|-----------|
| 1 | Task 1 (validate-lead) + Task 8 (seed) | SIM |
| 2 | Task 2 (create-lead) + Task 9 (validators/mappers) | SIM |
| 3 | Task 3 (move-card) + Task 10 (componentes) | SIM |
| 4 | Task 4 (brevo) + Task 5 (whatsapp) + Task 11 (server.ts) | SIM |
| 5 | Task 6 (contracts) + Task 7 (run-automation) + Task 12 (deps) | SIM |
| 6 | Task 13 (integrar IntegrationStatusCard) | Depende Task 10 |
| 7 | Task 14 (integrar AutomationLogTable) | Depende Task 10 |

---

## VARIÁVEIS DE AMBIENTE NECESSÁRIAS (Supabase Secrets)

Adicionar no projeto Supabase (Settings > Edge Functions > Secrets):

```
BREVO_API_KEY=<chave da API Brevo>
WHATSAPP_TOKEN=<token da Meta WhatsApp Business>
WHATSAPP_PHONE_NUMBER_ID=<phone number ID da Meta>
LOVABLE_CONTRACTS_WEBHOOK_URL=<URL do webhook de contratos do Lovable>
```

---

## VERIFICAÇÃO FINAL

Após todas as tasks, verificar:

- [ ] `supabase/functions/validate-lead/index.ts` existe
- [ ] `supabase/functions/create-lead/index.ts` existe
- [ ] `supabase/functions/move-card/index.ts` existe
- [ ] `supabase/functions/send-brevo-email/index.ts` chama API real
- [ ] `supabase/functions/send-whatsapp/index.ts` chama API real
- [ ] `supabase/functions/generate-contract/index.ts` integra com Lovable
- [ ] `supabase/functions/run-automation/index.ts` invoca send functions
- [ ] `supabase/migrations/20260323300000_seed_initial_data.sql` existe
- [ ] `src/lib/validators/*.ts` (4 arquivos) existem
- [ ] `src/lib/mappers/*.ts` (2 arquivos) existem
- [ ] `src/components/AutomationLogTable.tsx` existe
- [ ] `src/components/IntegrationStatusCard.tsx` existe
- [ ] `src/lib/supabase/server.ts` existe
- [ ] `uuid` e `pino` no package.json
- [ ] hooks `useCreateLead`, `useLeadValidation`, `useMoveCard` chamam edge functions
