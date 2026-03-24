import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IntegrationConnection {
  id: string;
  provider: string;
  active: boolean;
  last_sync_at: string | null;
}

interface Props {
  connection: IntegrationConnection;
}

const PROVIDER_LABELS: Record<string, string> = {
  brevo: "Brevo (E-mail)",
  whatsapp_official: "WhatsApp Oficial",
  google_meet: "Google Meet",
  elephan: "Elephan IA",
  contracts: "Contratos Lovable",
};

export function IntegrationStatusCard({ connection }: Props) {
  const label = PROVIDER_LABELS[connection.provider] ?? connection.provider;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {connection.active ? (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" /> Ativo
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Inativo
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {connection.last_sync_at ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Última sync:{" "}
            {formatDistanceToNow(new Date(connection.last_sync_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Nunca sincronizado</p>
        )}
      </CardContent>
    </Card>
  );
}
