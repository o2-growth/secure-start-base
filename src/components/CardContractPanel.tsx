import { useContractGeneration } from "@/hooks/useContractGeneration";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  pending_signature: "Aguardando Assinatura",
  signed: "Assinado",
  cancelled: "Cancelado",
};

interface Props {
  cardId: string;
  contractStatus: string | null;
  canGenerate: boolean;
}

export function CardContractPanel({ cardId, contractStatus, canGenerate }: Props) {
  const generate = useContractGeneration(cardId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" /> Contrato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contractStatus ? (
          <Badge variant="outline">{STATUS_LABELS[contractStatus] ?? contractStatus}</Badge>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum contrato gerado</p>
        )}
        {canGenerate && !contractStatus && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            {generate.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Gerar Contrato
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
