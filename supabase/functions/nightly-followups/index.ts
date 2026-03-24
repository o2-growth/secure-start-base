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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find pending automation runs whose scheduled_for has passed
    const { data: pendingRuns, error: fetchError } = await supabase
      .from("automation_runs")
      .select("*, automation_rules(actions)")
      .eq("status", "pending");

    if (fetchError) throw new Error(fetchError.message);

    const now = new Date();
    let processed = 0;
    let skipped = 0;

    for (const run of pendingRuns || []) {
      const inputPayload = (run.input_payload as any) ?? {};
      const scheduledFor = inputPayload.scheduled_for;

      // Skip if not yet due
      if (!scheduledFor || new Date(scheduledFor) > now) continue;

      const actions = (run.automation_rules as any)?.actions ?? {};
      const stopOnWon: boolean = actions.stop_on_won ?? true;
      const stopOnLost: boolean = actions.stop_on_lost ?? true;
      const stopOnPhaseChange: boolean = actions.stop_on_phase_change ?? true;
      const initialPhaseId: string | null = inputPayload.initial_phase_id ?? null;

      // Fetch card to check stop conditions
      const { data: card } = await supabase
        .from("cards")
        .select("id, status, current_phase_id")
        .eq("id", run.card_id)
        .single();

      if (!card) {
        // Card not found — skip silently
        await supabase.from("automation_runs").update({
          status: "failed",
          error_message: "Card not found",
          executed_at: now.toISOString(),
        }).eq("id", run.id);
        skipped++;
        continue;
      }

      // Check stop conditions
      let stopReason: string | null = null;

      if (stopOnWon && card.status === "won") {
        stopReason = "stopped: card won";
      } else if (stopOnLost && card.status === "lost") {
        stopReason = "stopped: card lost";
      } else if (stopOnPhaseChange && initialPhaseId && card.current_phase_id !== initialPhaseId) {
        stopReason = "stopped: phase changed";
      }

      if (stopReason) {
        await supabase.from("automation_runs").update({
          status: "failed",
          error_message: stopReason,
          executed_at: now.toISOString(),
        }).eq("id", run.id);
        skipped++;
        continue;
      }

      // Mark as running
      await supabase.from("automation_runs").update({ status: "running" }).eq("id", run.id);

      try {
        const channel = actions.channel;
        const templateId = actions.template_id;

        if (channel && templateId) {
          if (channel === "email" || channel === "both") {
            await supabase.functions.invoke("send-brevo-email", {
              body: { card_id: run.card_id, template_id: templateId },
            });
          }
          if (channel === "whatsapp" || channel === "both") {
            // Fetch phone from lead
            const { data: cardWithLead } = await supabase
              .from("cards")
              .select("leads(phone)")
              .eq("id", run.card_id)
              .single();
            const phone = (cardWithLead?.leads as any)?.phone ?? null;
            if (phone) {
              await supabase.functions.invoke("send-whatsapp", {
                body: { card_id: run.card_id, template_id: templateId, phone },
              });
            }
          }
        }

        await supabase.from("activities").insert({
          card_id: run.card_id,
          type: "system",
          payload: { automation_run_id: run.id, followup: true },
        });

        await supabase.from("automation_runs").update({
          status: "success",
          executed_at: now.toISOString(),
          output_payload: { channel, template_id: templateId },
        }).eq("id", run.id);

        processed++;
      } catch (execError: any) {
        await supabase.from("automation_runs").update({
          status: "failed",
          error_message: execError.message,
          executed_at: now.toISOString(),
        }).eq("id", run.id);
      }
    }

    return new Response(JSON.stringify({ processed, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
