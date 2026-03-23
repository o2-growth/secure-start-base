import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FieldType = Database["public"]["Enums"]["field_type"];

export function useAdminPipelines() {
  return useQuery({
    queryKey: ["admin-pipelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*, business_units(name), pipeline_phases(id, name, position, is_final), pipeline_fields(id, label, key, type, required, phase_id, visible_on_card, visible_on_start_form, position, options)")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { name: string; business_unit_id: string; audience: "internal" | "franchise" }) => {
      const { error } = await supabase.from("pipelines").insert(p);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pipelines"] }),
  });
}

export function useUpdatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; active?: boolean }) => {
      const { error } = await supabase.from("pipelines").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pipelines"] }),
  });
}

// Phases
export function useCreatePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { pipeline_id: string; name: string; position: number; is_final?: boolean }) => {
      const { error } = await supabase.from("pipeline_phases").insert(p);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pipelines"] }),
  });
}

export function useUpdatePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; position?: number; is_final?: boolean }) => {
      const { error } = await supabase.from("pipeline_phases").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pipelines"] }),
  });
}

// Fields
export function useCreateField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: {
      pipeline_id: string;
      label: string;
      key: string;
      type: FieldType;
      required?: boolean;
      phase_id?: string | null;
      visible_on_card?: boolean;
      visible_on_start_form?: boolean;
      position?: number;
    }) => {
      const { error } = await supabase.from("pipeline_fields").insert(f);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pipelines"] }),
  });
}

export function useUpdateField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      label?: string;
      key?: string;
      type?: FieldType;
      required?: boolean;
      phase_id?: string | null;
      visible_on_card?: boolean;
      visible_on_start_form?: boolean;
      position?: number;
    }) => {
      const { error } = await supabase.from("pipeline_fields").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pipelines"] }),
  });
}
