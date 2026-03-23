import { useState } from "react";
import { useSendMessage } from "@/hooks/useSendMessage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare, Loader2, Send } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Channel = Database["public"]["Enums"]["message_channel"];

interface Props {
  cardId: string;
  leadPhone?: string | null;
}

export function CardMessagePanel({ cardId, leadPhone }: Props) {
  const { templates, send } = useSendMessage(cardId);
  const [channel, setChannel] = useState<Channel>("email");
  const [templateId, setTemplateId] = useState("");

  const filtered = templates.data?.filter((t) => t.channel === channel) ?? [];

  const handleSend = () => {
    if (!templateId) return;
    send.mutate(
      { channel, templateId, phone: leadPhone || undefined },
      { onSuccess: () => setTemplateId("") }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4" /> Comunicação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant={channel === "email" ? "default" : "outline"}
            size="sm"
            onClick={() => { setChannel("email"); setTemplateId(""); }}
            className="flex-1"
          >
            <Mail className="h-3 w-3 mr-1" /> E-mail
          </Button>
          <Button
            variant={channel === "whatsapp" ? "default" : "outline"}
            size="sm"
            onClick={() => { setChannel("whatsapp"); setTemplateId(""); }}
            className="flex-1"
            disabled={!leadPhone}
          >
            <MessageSquare className="h-3 w-3 mr-1" /> WhatsApp
          </Button>
        </div>

        <Select value={templateId} onValueChange={setTemplateId}>
          <SelectTrigger className="text-xs h-8">
            <SelectValue placeholder="Selecionar template..." />
          </SelectTrigger>
          <SelectContent>
            {filtered.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
            {filtered.length === 0 && (
              <SelectItem value="_none" disabled>Nenhum template disponível</SelectItem>
            )}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          className="w-full"
          onClick={handleSend}
          disabled={!templateId || send.isPending}
        >
          {send.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
          Enviar
        </Button>
      </CardContent>
    </Card>
  );
}
