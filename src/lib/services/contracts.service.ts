import { supabase } from "@/integrations/supabase/client";

export async function generateContract(cardId: string) {
  const { data, error } = await supabase.functions.invoke("generate-contract", {
    body: { card_id: cardId },
  });
  if (error) throw new Error(error.message);
  return data;
}
