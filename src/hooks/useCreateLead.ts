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
      const { data, error } = await supabase.functions.invoke("create-lead", {
        body: {
          pipeline_id: input.pipelineId,
          organization_id: input.organizationId,
          business_unit_id: input.businessUnitId,
          full_name: input.fullName,
          email: input.email,
          phone: input.phone,
          document: input.document,
          company_name: input.companyName,
          source: input.source,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data as { card_id: string; lead_id: string };
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
