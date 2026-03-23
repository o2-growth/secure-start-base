import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface PipelineField {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: any;
  visible_on_card: boolean;
}

interface FieldValue {
  id: string;
  pipeline_field_id: string;
  value: any;
}

interface Props {
  cardId: string;
  fields: PipelineField[];
  values: FieldValue[];
  onSaved: () => void;
}

export function CardForm({ cardId, fields, values, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const valuesMap = new Map(values.map((v) => [v.pipeline_field_id, v]));

  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => {
      const existing = valuesMap.get(f.id);
      init[f.id] = existing?.value != null ? String(existing.value).replace(/^"|"$/g, "") : "";
    });
    return init;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      for (const field of fields) {
        const val = formValues[field.id] ?? "";
        const existing = valuesMap.get(field.id);

        if (existing) {
          await supabase
            .from("card_field_values")
            .update({ value: val as any, updated_by: user.id })
            .eq("id", existing.id);
        } else if (val) {
          await supabase.from("card_field_values").insert({
            card_id: cardId,
            pipeline_field_id: field.id,
            value: val as any,
            updated_by: user.id,
          });
        }
      }
      toast({ title: "Campos salvos" });
      onSaved();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (fields.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum campo configurado.</p>;
  }

  return (
    <div className="space-y-4">
      {fields.filter((f) => f.visible_on_card !== false).map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          {field.type === "textarea" ? (
            <Textarea
              value={formValues[field.id] ?? ""}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, [field.id]: e.target.value }))
              }
              className="text-sm"
            />
          ) : field.type === "select" ? (
            <Select
              value={formValues[field.id] ?? ""}
              onValueChange={(val) =>
                setFormValues((p) => ({ ...p, [field.id]: val }))
              }
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(field.options) ? field.options : []).map((opt: string) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
              value={formValues[field.id] ?? ""}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, [field.id]: e.target.value }))
              }
              className="text-sm"
            />
          )}
        </div>
      ))}
      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
        Salvar campos
      </Button>
    </div>
  );
}
