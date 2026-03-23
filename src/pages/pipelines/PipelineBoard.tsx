import { Card, CardContent } from "@/components/ui/card";
import { Kanban } from "lucide-react";

export default function PipelineBoard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pipeline Board</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualização Kanban do pipeline
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Kanban className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            O board Kanban será implementado na Fase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
