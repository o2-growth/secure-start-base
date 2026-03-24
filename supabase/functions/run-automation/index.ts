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
    const { card_id, trigger_type } = await req.json();

    if (!card_id || !trigger_type) {
      return new Response(JSON.stringify({ error: "card_id and trigger_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get card with pipeline info
    const { data: card, error: cardError } = await supabase
      .from("cards")
      .select("*, leads(full_name, email, phone), pipelines(name, business_unit_id)")
      .eq("id", card_id)
      .single();

    if (cardError || !card) {
      return new Response(JSON.stringify({ error: "Card not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find matching active automation rules
    const { data: rules } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("pipeline_id", card.pipeline_id)
      .eq("trigger_type", trigger_type)
      .eq("active", true);

    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ message: "No matching rules", executed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const rule of rules) {
      const conditions = rule.conditions as Record<string, unknown>;
      const actions = rule.actions as Record<string, unknown>;

      // Evaluate conditions (simple matching for MVP)
      let conditionsMet = true;
      if (conditions && typeof conditions === "object") {
        // Check phase_id condition
        if (conditions.phase_id && conditions.phase_id !== card.current_phase_id) {
          conditionsMet = false;
        }
        // Check status condition
        if (conditions.status && conditions.status !== card.status) {
          conditionsMet = false;
        }
      }

      if (!conditionsMet) {
        results.push({ rule_id: rule.id, skipped: true, reason: "conditions_not_met" });
        continue;
      }

      // Check delay-based actions
      const delayDays = (actions as any)?.delay_days;
      if (delayDays && delayDays > 0) {
        // Record as pending for nightly cron to process
        await supabase.from("automation_runs").insert({
          rule_id: rule.id,
          card_id: card_id,
          status: "pending",
          input_payload: {
            trigger_type,
            delay_days: delayDays,
            scheduled_for: new Date(Date.now() + delayDays * 86400000).toISOString(),
            initial_phase_id: card.current_phase_id,
          },
        });
        results.push({ rule_id: rule.id, status: "pending", delay_days: delayDays });
        continue;
      }

      // Execute immediate actions
      try {
        // Log the run
        const { data: run } = await supabase.from("automation_runs").insert({
          rule_id: rule.id,
          card_id: card_id,
          status: "running",
          input_payload: { trigger_type, card_status: card.status },
        }).select().single();

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

        // Register activity
        await supabase.from("activities").insert({
          card_id: card_id,
          type: "system",
          payload: { automation_rule_id: rule.id, trigger_type, actions },
        });

        // Mark as success
        if (run) {
          await supabase.from("automation_runs")
            .update({ status: "success", output_payload: { channel, template_id: templateId } })
            .eq("id", run.id);
        }

        results.push({ rule_id: rule.id, status: "success" });
      } catch (execError: any) {
        await supabase.from("automation_runs").insert({
          rule_id: rule.id,
          card_id: card_id,
          status: "failed",
          error_message: execError.message,
        });
        results.push({ rule_id: rule.id, status: "failed", error: execError.message });
      }
    }

    return new Response(JSON.stringify({ executed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
