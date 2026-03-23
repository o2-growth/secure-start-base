import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateLeadInput {
  pipelineId: string;
  organizationId: string;
  businessUnitId: string;
  fullName: string;
  email?: string;
  phone?: string;
  document?: string;
  companyName?: string;
  source?: string;
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // 1. Get first phase
      const { data: phases, error: phError } = await supabase
        .from("pipeline_phases")
        .select("id")
        .eq("pipeline_id", input.pipelineId)
        .order("position")
        .limit(1);
      if (phError) throw phError;
      if (!phases?.length) throw new Error("Pipeline sem fases configuradas");

      // 2. Get profile
      const { data: profile, error: prError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (prError) throw prError;

      // 3. Insert lead
      const { data: lead, error: leadErr } = await supabase
        .from("leads")
        .insert({
          organization_id: input.organizationId,
          business_unit_id: input.businessUnitId,
          full_name: input.fullName,
          email: input.email || null,
          phone: input.phone || null,
          document: input.document || null,
          company_name: input.companyName || null,
          source: input.source || null,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (leadErr) throw leadErr;

      // 4. Insert card
      const { data: card, error: cardErr } = await supabase
        .from("cards")
        .insert({
          lead_id: lead.id,
          pipeline_id: input.pipelineId,
          current_phase_id: phases[0].id,
          owner_profile_id: profile.id,
          status: "open",
          origin: "manual",
        })
        .select("id")
        .single();
      if (cardErr) throw cardErr;

      // 5. Activity
      await supabase.from("activities").insert({
        card_id: card.id,
        type: "system",
        payload: { message: "Lead criado manualmente" },
        created_by: user.id,
      });

      return card;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-cards"] });
      toast({ title: "Lead criado com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar lead", description: err.message, variant: "destructive" });
    },
  });
}
