import { Card, CardContent } from "@/components/ui/card";
import { Puzzle } from "lucide-react";

export default function Integrations() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Brevo, WhatsApp, Google Meet, Elephan, Contratos
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Puzzle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Integrações serão implementadas na Fase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
