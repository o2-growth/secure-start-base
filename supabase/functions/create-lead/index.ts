import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_ROLES = ["admin", "enablement", "head", "closer", "sdr", "bdr"];

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

    // Check role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (roleError || !roleData || !ALLOWED_ROLES.includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const body = await req.json();
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
    } = body;

    // Validate required fields
    if (!pipeline_id || !organization_id || !business_unit_id || !full_name) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: pipeline_id, organization_id, business_unit_id, full_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch first pipeline phase
    const { data: phases, error: phError } = await supabase
      .from("pipeline_phases")
      .select("id")
      .eq("pipeline_id", pipeline_id)
      .order("position", { ascending: true })
      .limit(1);

    if (phError) throw phError;
    if (!phases?.length) {
      return new Response(JSON.stringify({ error: "Pipeline sem fases configuradas" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch caller profile
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
        email: email ?? null,
        phone: phone ?? null,
        document: document ?? null,
        company_name: company_name ?? null,
        source: source ?? null,
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

    // Fire and forget automation trigger
    supabase.functions
      .invoke("run-automation", { body: { card_id: card.id, trigger_type: "card_created" } })
      .catch(() => {});

    return new Response(JSON.stringify({ card_id: card.id, lead_id: lead.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
