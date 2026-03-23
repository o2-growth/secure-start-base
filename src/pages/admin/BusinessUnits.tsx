import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function BusinessUnits() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Business Units</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerenciar unidades de negócio
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Gestão de BUs será implementada na Fase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
