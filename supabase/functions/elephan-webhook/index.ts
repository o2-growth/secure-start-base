import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

    const { card_id, meeting_external_id, transcript_text, recording_url, summary } = await req.json();
    if (!card_id || !meeting_external_id) {
      return new Response(JSON.stringify({ error: "card_id and meeting_external_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to find existing meeting record
    const { data: existing } = await supabase
      .from("meeting_records")
      .select("id")
      .eq("card_id", card_id)
      .eq("meeting_external_id", meeting_external_id)
      .maybeSingle();

    let meetingId: string;

    if (existing) {
      const { error } = await supabase
        .from("meeting_records")
        .update({
          provider: "elephan",
          transcript_text: transcript_text || null,
          recording_url: recording_url || null,
          summary: summary || null,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      meetingId = existing.id;
    } else {
      const { data: record, error } = await supabase
        .from("meeting_records")
        .insert({
          card_id,
          provider: "elephan",
          meeting_external_id,
          transcript_text: transcript_text || null,
          recording_url: recording_url || null,
          summary: summary || null,
          occurred_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      meetingId = record.id;
    }

    await supabase.from("activities").insert({
      card_id,
      type: "meeting",
      payload: { meeting_id: meetingId, provider: "elephan", has_transcript: !!transcript_text },
    });

    return new Response(JSON.stringify({ success: true, meeting_id: meetingId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
