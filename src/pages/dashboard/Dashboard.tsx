import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { useBusinessUnits } from "@/hooks/useBusinessUnits";
import { usePipelines } from "@/hooks/usePipelines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Kanban, Users, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();
  const { data: bus, isLoading: busLoading } = useBusinessUnits();
  const { data: pipelines, isLoading: pipelinesLoading } = usePipelines();

  const isLoading = profileLoading || busLoading || pipelinesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Business Units",
      value: bus?.length ?? 0,
      icon: Building2,
      color: "text-info",
    },
    {
      title: "Pipelines Ativos",
      value: pipelines?.length ?? 0,
      icon: Kanban,
      color: "text-primary",
    },
    {
      title: "Seu Perfil",
      value: profile?.role ?? "—",
      icon: Users,
      color: "text-warning",
    },
    {
      title: "Organização",
      value: profile?.orgName ?? "—",
      icon: TrendingUp,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {profile?.fullName ?? "Usuário"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bem-vindo ao O2 CRM
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline summary cards */}
      {pipelines && pipelines.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Pipelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pipelines.map((pipeline: any) => (
              <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{pipeline.name}</CardTitle>
                    <Badge variant="outline">
                      {(pipeline.business_units as any)?.name ?? "—"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 flex-wrap">
                    {pipeline.pipeline_phases
                      ?.sort((a: any, b: any) => a.position - b.position)
                      .map((phase: any) => (
                        <Badge
                          key={phase.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {phase.name}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
