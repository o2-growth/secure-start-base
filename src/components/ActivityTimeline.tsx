import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquare,
  Mail,
  Phone,
  Video,
  ArrowRight,
  FileText,
  Settings,
  StickyNote,
} from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Activity {
  id: string;
  type: string;
  payload: Json;
  created_at: string;
  created_by: string | null;
}

const ICONS: Record<string, React.ElementType> = {
  note: StickyNote,
  email: Mail,
  whatsapp: Phone,
  meeting: Video,
  move: ArrowRight,
  contract: FileText,
  system: Settings,
};

function formatPayload(type: string, payload: any): string {
  if (type === "move") return `Movido para: ${payload?.to_phase ?? "—"}`;
  if (type === "note") return payload?.text ?? "";
  if (type === "system") return payload?.message ?? "";
  if (type === "email") return `E-mail: ${payload?.subject ?? "enviado"}`;
  if (type === "whatsapp") return `WhatsApp: ${payload?.message ?? "enviado"}`;
  if (type === "meeting") return `Reunião: ${payload?.url ?? "registrada"}`;
  if (type === "contract") return `Contrato: ${payload?.status ?? "gerado"}`;
  return JSON.stringify(payload);
}

interface Props {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhuma atividade registrada.
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      {activities.map((a) => {
        const Icon = ICONS[a.type] ?? MessageSquare;
        return (
          <div key={a.id} className="flex gap-3 py-3 relative">
            <div className="relative z-10 flex items-center justify-center h-8 w-8 rounded-full border bg-card shrink-0">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                {formatPayload(a.type, a.payload)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(a.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
