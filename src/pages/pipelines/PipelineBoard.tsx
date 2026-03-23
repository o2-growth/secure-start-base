import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePipelineBoard } from "@/hooks/usePipelineBoard";
import { KanbanBoard } from "@/components/KanbanBoard";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, AlertCircle } from "lucide-react";

export default function PipelineBoard() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();

  const pipelineQuery = useQuery({
    queryKey: ["pipeline", pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*, business_units(name)")
        .eq("id", pipelineId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!pipelineId,
  });

  const { phases, isLoading, error } = usePipelineBoard(pipelineId);
  const pipeline = pipelineQuery.data;
  const buName = (pipeline as any)?.business_units?.name;

  const handleCardClick = (cardId: string) => {
    navigate(`/pipelines/${pipelineId}/cards/${cardId}`);
  };

  return (
    <AppShell>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {pipeline?.name ?? "Pipeline"}
            </h1>
            {buName && (
              <Badge variant="secondary" className="text-xs">
                {buName}
              </Badge>
            )}
          </div>
          <Button onClick={() => navigate(`/pipelines/${pipelineId}/new-lead`)}>
            <UserPlus className="h-4 w-4 mr-1" />
            Novo Lead
          </Button>
        </div>

        {/* States */}
        {isLoading && (
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[280px]">
                <Skeleton className="h-6 w-24 mb-3" />
                <Skeleton className="h-[200px] rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-destructive p-4">
            <AlertCircle className="h-5 w-5" />
            <p>Erro ao carregar pipeline: {(error as Error).message}</p>
          </div>
        )}

        {!isLoading && !error && pipelineId && (
          <KanbanBoard
            phases={phases}
            pipelineId={pipelineId}
            onCardClick={handleCardClick}
          />
        )}
      </div>
    </AppShell>
  );
}
