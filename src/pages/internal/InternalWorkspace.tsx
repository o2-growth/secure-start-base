import { usePipelines } from "@/hooks/usePipelines";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Kanban } from "lucide-react";

export default function InternalWorkspace() {
  const { data: profile } = useCurrentProfile();
  const { data: pipelines, isLoading } = usePipelines();
  const navigate = useNavigate();

  const internalPipelines = pipelines?.filter(
    (p: any) => p.audience === "internal"
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Área Interna</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pipelines do time interno O2
        </p>
      </div>

      {(!internalPipelines || internalPipelines.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Kanban className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum pipeline interno disponível.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {internalPipelines.map((pipeline: any) => (
            <Card
              key={pipeline.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/pipelines/${pipeline.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{pipeline.name}</CardTitle>
                  <Badge variant="outline">
                    {(pipeline.business_units as any)?.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1 flex-wrap">
                  {pipeline.pipeline_phases
                    ?.sort((a: any, b: any) => a.position - b.position)
                    .map((phase: any) => (
                      <Badge key={phase.id} variant="secondary" className="text-xs">
                        {phase.name}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
