import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MoveCardInput {
  cardId: string;
  targetPhaseId: string;
  targetPhaseName?: string;
}

export interface MissingField {
  id: string;
  label: string;
  key: string;
}

export class MissingFieldsError extends Error {
  missingFields: MissingField[];
  constructor(fields: MissingField[]) {
    super("missing_required_fields");
    this.missingFields = fields;
  }
}


export function useMoveCard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: MoveCardInput) => {
      const { data, error } = await supabase.functions.invoke("move-card", {
        body: {
          card_id: input.cardId,
          target_phase_id: input.targetPhaseId,
          target_phase_name: input.targetPhaseName,
        },
      });

      if (error) throw error;
      if (data?.error === "missing_required_fields") {
        throw new MissingFieldsError(data.missing_fields ?? []);
      }
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-cards"] });
      queryClient.invalidateQueries({ queryKey: ["card"] });
      queryClient.invalidateQueries({ queryKey: ["card-activities"] });
      toast({ title: "Card movido com sucesso" });
    },
    onError: (err: Error) => {
      if (err instanceof MissingFieldsError) return; // PhaseGuardDialog handles this
      toast({ title: "Erro ao mover card", description: err.message, variant: "destructive" });
    },
  });
}
