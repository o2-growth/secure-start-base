import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCard(cardId: string | undefined) {
  const cardQuery = useQuery({
    queryKey: ["card", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select(`
          *,
          leads(id, full_name, email, phone, document, company_name, source),
          pipeline_phases(id, name, position),
          profiles!cards_owner_profile_id_fkey(id, full_name),
          pipelines(id, name, business_unit_id)
        `)
        .eq("id", cardId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!cardId,
  });

  const fieldsQuery = useQuery({
    queryKey: ["card-fields", cardId],
    queryFn: async () => {
      if (!cardQuery.data) return { fields: [], values: [] };
      const pipelineId = cardQuery.data.pipeline_id;

      const [fieldsRes, valuesRes] = await Promise.all([
        supabase
          .from("pipeline_fields")
          .select("*")
          .eq("pipeline_id", pipelineId)
          .order("position"),
        supabase
          .from("card_field_values")
          .select("*")
          .eq("card_id", cardId!),
      ]);
      if (fieldsRes.error) throw fieldsRes.error;
      if (valuesRes.error) throw valuesRes.error;
      return { fields: fieldsRes.data, values: valuesRes.data };
    },
    enabled: !!cardQuery.data,
  });

  const activitiesQuery = useQuery({
    queryKey: ["card-activities", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("card_id", cardId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!cardId,
  });

  const phasesQuery = useQuery({
    queryKey: ["card-pipeline-phases", cardQuery.data?.pipeline_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_phases")
        .select("*")
        .eq("pipeline_id", cardQuery.data!.pipeline_id)
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!cardQuery.data?.pipeline_id,
  });

  return {
    card: cardQuery.data ?? null,
    fields: fieldsQuery.data?.fields ?? [],
    fieldValues: fieldsQuery.data?.values ?? [],
    activities: activitiesQuery.data ?? [],
    phases: phasesQuery.data ?? [],
    isLoading: cardQuery.isLoading,
    error: cardQuery.error,
    refetch: () => {
      cardQuery.refetch();
      fieldsQuery.refetch();
      activitiesQuery.refetch();
    },
  };
}
