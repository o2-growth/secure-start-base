import { z } from "zod";

export const contractGenerationSchema = z.object({
  cardId: z.string().uuid("card_id inválido"),
});

export type ContractGenerationInput = z.infer<typeof contractGenerationSchema>;
