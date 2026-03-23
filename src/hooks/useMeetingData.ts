import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { attachMeeting } from "@/lib/services/meet.service";
import { useToast } from "@/hooks/use-toast";

export function useMeetingData(cardId?: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const meetings = useQuery({
    queryKey: ["meetings", cardId],
    enabled: !!cardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_records")
        .select("*")
        .eq("card_id", cardId!)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const attach = useMutation({
    mutationFn: ({ meetingUrl, externalId }: { meetingUrl: string; externalId?: string }) => {
      if (!cardId) throw new Error("cardId required");
      return attachMeeting(cardId, meetingUrl, externalId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", cardId] });
      qc.invalidateQueries({ queryKey: ["card", cardId] });
      toast({ title: "Reunião vinculada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return { meetings, attach };
}
