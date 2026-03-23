import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AutomationTrigger = Database["public"]["Enums"]["automation_trigger"];
type Json = Database["public"]["Tables"]["automation_rules"]["Row"]["conditions"];

export function useAutomationRules() {
  return useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*, pipelines(name, business_units(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAutomationRuns(ruleId?: string) {
  return useQuery({
    queryKey: ["automation-runs", ruleId],
    enabled: !!ruleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_runs")
        .select("*")
        .eq("rule_id", ruleId!)
        .order("executed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: {
      pipeline_id: string;
      trigger_type: AutomationTrigger;
      conditions: Json;
      actions: Json;
      active?: boolean;
    }) => {
      const { error } = await supabase.from("automation_rules").insert(rule);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-rules"] }),
  });
}

export function useUpdateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      trigger_type?: AutomationTrigger;
      conditions?: Json;
      actions?: Json;
      active?: boolean;
    }) => {
      const { error } = await supabase.from("automation_rules").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automation-rules"] }),
  });
}
