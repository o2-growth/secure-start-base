import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MoveCardInput {
  cardId: string;
  targetPhaseId: string;
  targetPhaseName: string;
}

export interface MissingField {
  id: string;
  label: string;
  key: string;
}

export async function validatePhaseFields(
  cardId: string,
  targetPhaseId: string,
  pipelineId: string
): Promise<MissingField[]> {
  // Get required fields for target phase
  const { data: fields } = await supabase
    .from("pipeline_fields")
    .select("id, label, key")
    .eq("pipeline_id", pipelineId)
    .eq("phase_id", targetPhaseId)
    .eq("required", true);

  if (!fields?.length) return [];

  // Get current field values
  const { data: values } = await supabase
    .from("card_field_values")
    .select("pipeline_field_id, value")
    .eq("card_id", cardId);

  const valuesMap = new Map(
    (values ?? []).map((v) => [v.pipeline_field_id, v.value])
  );

  return fields.filter((f) => {
    const val = valuesMap.get(f.id);
    return val === null || val === undefined || val === "" || val === '""';
  });
}

export function useMoveCard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: MoveCardInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("cards")
        .update({ current_phase_id: input.targetPhaseId })
        .eq("id", input.cardId);
      if (error) throw error;

      await supabase.from("activities").insert({
        card_id: input.cardId,
        type: "move",
        payload: {
          to_phase: input.targetPhaseName,
          to_phase_id: input.targetPhaseId,
        },
        created_by: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-cards"] });
      queryClient.invalidateQueries({ queryKey: ["card"] });
      queryClient.invalidateQueries({ queryKey: ["card-activities"] });
      toast({ title: "Card movido com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao mover card", description: err.message, variant: "destructive" });
    },
  });
}
