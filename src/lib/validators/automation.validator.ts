import { z } from "zod";

export const automationRuleSchema = z.object({
  pipelineId: z.string().uuid(),
  triggerType: z.enum(["card_created", "phase_enter", "delay_elapsed", "meeting_finished"]),
  conditions: z.record(z.unknown()).default({}),
  actions: z
    .object({
      channel: z.enum(["email", "whatsapp", "both"]).optional(),
      template_id: z.string().uuid().optional(),
      delay_days: z.number().int().min(0).optional(),
      stop_on_phase_change: z.boolean().default(true),
      stop_on_won: z.boolean().default(true),
      stop_on_lost: z.boolean().default(true),
      stop_on_reply: z.boolean().default(false),
    })
    .passthrough(),
  active: z.boolean().default(true),
});

export type AutomationRuleFormData = z.infer<typeof automationRuleSchema>;
