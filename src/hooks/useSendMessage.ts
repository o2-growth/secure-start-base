import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sendBrevoEmail } from "@/lib/services/brevo.service";
import { sendWhatsApp } from "@/lib/services/whatsapp.service";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type MessageChannel = Database["public"]["Enums"]["message_channel"];

export function useSendMessage(cardId?: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const templates = useQuery({
    queryKey: ["message-templates-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("id, name, channel, category, subject")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const send = useMutation({
    mutationFn: async ({
      channel,
      templateId,
      phone,
    }: {
      channel: MessageChannel;
      templateId: string;
      phone?: string;
    }) => {
      if (!cardId) throw new Error("cardId required");
      if (channel === "email") {
        return sendBrevoEmail(cardId, templateId);
      } else {
        if (!phone) throw new Error("phone required for whatsapp");
        return sendWhatsApp(cardId, templateId, phone);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["card", cardId] });
      toast({
        title: vars.channel === "email" ? "E-mail enviado" : "WhatsApp enviado",
        description: "Mensagem registrada com sucesso.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return { templates, send };
}
