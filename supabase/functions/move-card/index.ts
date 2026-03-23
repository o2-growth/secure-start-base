import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims)
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    const userId = claimsData.claims.sub;

    // Parse body
    const body = await req.json();
    const { card_id, target_phase_id, target_phase_name } = body ?? {};

    if (!card_id || !target_phase_id)
      return new Response(
        JSON.stringify({ error: "card_id and target_phase_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    // Fetch caller profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", userId)
      .single();

    // Fetch caller role
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    const role = roleRow?.role ?? null;

    // Fetch card
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("id, owner_profile_id, pipeline_id, status")
      .eq("id", card_id)
      .single();

    if (cardError || !card)
      return new Response(
        JSON.stringify({ error: "Card not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    // RBAC: closer can only move own cards
    if (role === "closer" && card.owner_profile_id !== profile?.id)
      return new Response(
        JSON.stringify({ error: "closer can only move own cards" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    // Validate required fields for target phase
    const { data: requiredFields } = await supabase
      .from("pipeline_fields")
      .select("id, label, key")
      .eq("pipeline_id", card.pipeline_id)
      .eq("phase_id", target_phase_id)
      .eq("required", true);

    if (requiredFields && requiredFields.length > 0) {
      const { data: fieldValues } = await supabase
        .from("card_field_values")
        .select("pipeline_field_id, value")
        .eq("card_id", card_id);

      const valuesMap = new Map(
        (fieldValues ?? []).map((v: { pipeline_field_id: string; value: unknown }) => [
          v.pipeline_field_id,
          v.value,
        ])
      );

      const missingFields = requiredFields.filter((f: { id: string; label: string; key: string }) => {
        const val = valuesMap.get(f.id);
        return val === null || val === undefined || val === "" || val === '""';
      });

      if (missingFields.length > 0)
        return new Response(
          JSON.stringify({ error: "missing_required_fields", missing_fields: missingFields }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Update card phase
    const { error: updateError } = await supabase
      .from("cards")
      .update({ current_phase_id: target_phase_id })
      .eq("id", card_id);

    if (updateError) throw updateError;

    // Insert activity
    await supabase.from("activities").insert({
      card_id,
      type: "move",
      payload: {
        to_phase: target_phase_name ?? target_phase_id,
        to_phase_id: target_phase_id,
      },
      created_by: userId,
    });

    // Fire-and-forget automation trigger
    supabase.functions
      .invoke("run-automation", { body: { card_id, trigger_type: "phase_enter" } })
      .catch(() => {});

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
