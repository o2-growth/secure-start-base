import { Card, CardContent } from "@/components/ui/card";
import { Kanban } from "lucide-react";

export default function PipelinesConfig() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuração de Pipelines</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerenciar fases, campos e start forms
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Kanban className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Configuração de pipelines será implementada na Fase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
