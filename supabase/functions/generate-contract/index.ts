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

    // Check role
    const { data: hasRole } = await supabase.rpc("has_any_role", {
      _user_id: userId,
      _roles: ["admin", "enablement", "closer"],
    });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { card_id } = await req.json();
    if (!card_id) {
      return new Response(JSON.stringify({ error: "card_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        card_id,
        status: "draft",
        provider: "lovable",
        payload: {},
      })
      .select()
      .single();

    if (contractError) throw new Error(contractError.message);

    // Update card contract_status
    await supabase
      .from("cards")
      .update({ contract_status: "draft" })
      .eq("id", card_id);

    // Register activity
    await supabase.from("activities").insert({
      card_id,
      type: "contract",
      payload: { contract_id: contract.id, status: "draft" },
      created_by: userId,
    });

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

          await supabase.from("contracts").update({
            external_contract_id: externalId,
            status: "pending_signature",
            payload: { ...contractPayload, lovable_response: contractData },
          }).eq("id", contract.id);

          await supabase.from("cards").update({ contract_status: "pending_signature" }).eq("id", card_id);

          await supabase.from("activities").insert({
            card_id,
            type: "contract",
            payload: { contract_id: contract.id, status: "pending_signature", contract_url: contractUrl },
            created_by: userId,
          });
        }
      } catch (_integrationError) {
        // Non-blocking: contract record was created, integration failed silently
      }
    }

    return new Response(JSON.stringify({ success: true, contract_id: contract.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
