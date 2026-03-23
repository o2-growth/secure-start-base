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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate caller
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { card_id, template_id } = await req.json();
    if (!card_id || !template_id) {
      return new Response(JSON.stringify({ error: "card_id and template_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch template
    const { data: template } = await supabase
      .from("message_templates")
      .select("*")
      .eq("id", template_id)
      .eq("channel", "email")
      .eq("active", true)
      .single();

    if (!template) {
      return new Response(JSON.stringify({ error: "Template not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert message delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from("message_deliveries")
      .insert({
        card_id,
        channel: "email",
        template_id,
        status: "pending",
      })
      .select()
      .single();

    if (deliveryError) {
      throw new Error(`Failed to create delivery: ${deliveryError.message}`);
    }

    // Register activity
    await supabase.from("activities").insert({
      card_id,
      type: "email",
      payload: { template_name: template.name, delivery_id: delivery.id },
      created_by: userId,
    });

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

    return new Response(JSON.stringify({ success: true, delivery_id: delivery.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
