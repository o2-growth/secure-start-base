import { supabase } from "@/integrations/supabase/client";

export async function sendWhatsApp(cardId: string, templateId: string, phone: string) {
  const { data, error } = await supabase.functions.invoke("send-whatsapp", {
    body: { card_id: cardId, template_id: templateId, phone },
  });
  if (error) throw new Error(error.message);
  return data;
}
