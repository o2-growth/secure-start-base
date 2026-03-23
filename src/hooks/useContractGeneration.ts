import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateContract } from "@/lib/services/contracts.service";
import { useToast } from "@/hooks/use-toast";

export function useContractGeneration(cardId?: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () => {
      if (!cardId) throw new Error("cardId required");
      return generateContract(cardId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["card", cardId] });
      toast({ title: "Contrato gerado", description: "Rascunho criado com sucesso." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return mutation;
}
