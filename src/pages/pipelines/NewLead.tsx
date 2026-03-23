import { Card, CardContent } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

export default function NewLead() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novo Lead</h1>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Formulário de novo lead será implementado na Fase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
