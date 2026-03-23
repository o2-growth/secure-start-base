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

    const { card_id, template_id, phone } = await req.json();
    if (!card_id || !template_id || !phone) {
      return new Response(JSON.stringify({ error: "card_id, template_id and phone required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: template } = await supabase
      .from("message_templates")
      .select("*")
      .eq("id", template_id)
      .eq("channel", "whatsapp")
      .eq("active", true)
      .single();

    if (!template) {
      return new Response(JSON.stringify({ error: "Template not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: delivery, error: deliveryError } = await supabase
      .from("message_deliveries")
      .insert({
        card_id,
        channel: "whatsapp",
        template_id,
        status: "pending",
      })
      .select()
      .single();

    if (deliveryError) {
      throw new Error(`Failed to create delivery: ${deliveryError.message}`);
    }

    await supabase.from("activities").insert({
      card_id,
      type: "whatsapp",
      payload: { template_name: template.name, phone, delivery_id: delivery.id },
      created_by: userId,
    });

    // TODO: Replace with actual WhatsApp API call
    // const WA_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
    // await fetch("https://graph.facebook.com/...", { ... });

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
