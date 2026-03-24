import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("FRONTEND_URL") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate webhook secret
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  const incomingSecret = req.headers.get("X-Webhook-Secret");
  if (!webhookSecret || incomingSecret !== webhookSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { card_id, meeting_url, meeting_external_id, occurred_at } = await req.json();
    if (!card_id) {
      return new Response(JSON.stringify({ error: "card_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: record, error } = await supabase
      .from("meeting_records")
      .insert({
        card_id,
        provider: "google_meet",
        meeting_url: meeting_url || null,
        meeting_external_id: meeting_external_id || null,
        occurred_at: occurred_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await supabase.from("activities").insert({
      card_id,
      type: "meeting",
      payload: { meeting_id: record.id, provider: "google_meet", meeting_url },
    });

    return new Response(JSON.stringify({ success: true, meeting_id: record.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
