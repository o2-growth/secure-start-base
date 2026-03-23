import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function CardDetails() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Detalhes do Card</h1>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Detalhes do card serão implementados na Fase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
