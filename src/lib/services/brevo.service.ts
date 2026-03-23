import { supabase } from "@/integrations/supabase/client";

export async function sendBrevoEmail(cardId: string, templateId: string) {
  const { data, error } = await supabase.functions.invoke("send-brevo-email", {
    body: { card_id: cardId, template_id: templateId },
  });
  if (error) throw new Error(error.message);
  return data;
}
