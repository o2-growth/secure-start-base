import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePipelines(businessUnitId?: string) {
  return useQuery({
    queryKey: ["pipelines", businessUnitId],
    queryFn: async () => {
      let query = supabase
        .from("pipelines")
        .select("*, business_units(name, slug), pipeline_phases(id, name, position, is_final)")
        .eq("active", true)
        .order("name");

      if (businessUnitId) {
        query = query.eq("business_unit_id", businessUnitId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });
}
