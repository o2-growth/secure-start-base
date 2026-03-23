import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function AutomationRules() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Automações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Regras de automação e follow-ups
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Motor de automações será implementado na Fase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
