import { z } from "zod";

export const phaseFieldValueSchema = z.object({
  fieldId: z.string().uuid(),
  value: z.unknown(),
});

export function validateRequiredFields(
  fields: { id: string; label: string; key: string }[],
  values: Map<string, unknown>
): { id: string; label: string; key: string }[] {
  return fields.filter((f) => {
    const val = values.get(f.id);
    return val === null || val === undefined || val === "" || val === '""';
  });
}
