import { supabase } from "@/integrations/supabase/client";

export async function attachMeeting(
  cardId: string,
  meetingUrl: string,
  externalId?: string
) {
  const { data, error } = await supabase.functions.invoke("meet-webhook", {
    body: {
      card_id: cardId,
      meeting_url: meetingUrl,
      meeting_external_id: externalId || null,
      occurred_at: new Date().toISOString(),
    },
  });
  if (error) throw new Error(error.message);
  return data;
}
