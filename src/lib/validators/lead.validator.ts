import { z } from "zod";

export const leadSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-().]{8,}$/, "Telefone inválido")
    .optional()
    .or(z.literal("")),
  document: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
});

export type LeadFormData = z.infer<typeof leadSchema>;
