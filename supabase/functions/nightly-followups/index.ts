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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find pending automation runs whose scheduled_for has passed
    const { data: pendingRuns, error: fetchError } = await supabase
      .from("automation_runs")
      .select("*, automation_rules(*)")
      .eq("status", "pending");

    if (fetchError) throw new Error(fetchError.message);

    const now = new Date();
    let processed = 0;

    for (const run of pendingRuns || []) {
      const scheduledFor = (run.input_payload as any)?.scheduled_for;
      if (!scheduledFor || new Date(scheduledFor) > now) continue;

      // Mark as running
      await supabase
        .from("automation_runs")
        .update({ status: "running" })
        .eq("id", run.id);

      try {
        const actions = (run.automation_rules as any)?.actions || {};
        const channel = actions.channel;
        const templateId = actions.template_id;

        if (channel && templateId) {
          await supabase.from("message_deliveries").insert({
            card_id: run.card_id,
            channel,
            template_id: templateId,
            status: "pending",
          });
        }

        await supabase.from("activities").insert({
          card_id: run.card_id,
          type: "system",
          payload: { automation_run_id: run.id, followup: true },
        });

        await supabase
          .from("automation_runs")
          .update({
            status: "success",
            executed_at: now.toISOString(),
            output_payload: { channel, template_id: templateId },
          })
          .eq("id", run.id);

        processed++;
      } catch (execError: any) {
        await supabase
          .from("automation_runs")
          .update({
            status: "failed",
            error_message: execError.message,
            executed_at: now.toISOString(),
          })
          .eq("id", run.id);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
