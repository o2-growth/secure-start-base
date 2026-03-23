import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BoardCard {
  id: string;
  lead_id: string;
  pipeline_id: string;
  current_phase_id: string;
  owner_profile_id: string | null;
  status: string;
  origin: string;
  created_at: string;
  updated_at: string;
  leads: {
    full_name: string;
    email: string | null;
    phone: string | null;
    company_name: string | null;
  } | null;
  pipeline_phases: {
    name: string;
    position: number;
  } | null;
  owner: {
    full_name: string;
  } | null;
}

export interface BoardPhase {
  id: string;
  name: string;
  position: number;
  is_final: boolean;
  cards: BoardCard[];
}

export function usePipelineBoard(pipelineId: string | undefined) {
  const phasesQuery = useQuery({
    queryKey: ["pipeline-phases", pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_phases")
        .select("*")
        .eq("pipeline_id", pipelineId!)
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!pipelineId,
  });

  const cardsQuery = useQuery({
    queryKey: ["pipeline-cards", pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select(`
          *,
          leads(full_name, email, phone, company_name),
          pipeline_phases(name, position),
          profiles!cards_owner_profile_id_fkey(full_name)
        `)
        .eq("pipeline_id", pipelineId!)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        ...c,
        owner: c.profiles,
      })) as BoardCard[];
    },
    enabled: !!pipelineId,
  });

  const phases: BoardPhase[] = (phasesQuery.data ?? []).map((phase) => ({
    ...phase,
    cards: (cardsQuery.data ?? []).filter((c) => c.current_phase_id === phase.id),
  }));

  return {
    phases,
    isLoading: phasesQuery.isLoading || cardsQuery.isLoading,
    error: phasesQuery.error || cardsQuery.error,
    refetch: () => {
      phasesQuery.refetch();
      cardsQuery.refetch();
    },
  };
}
