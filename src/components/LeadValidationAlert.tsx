import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { DuplicateLead } from "@/hooks/useLeadValidation";

interface Props {
  duplicates: DuplicateLead[];
  canOverride: boolean;
  onOverride: () => void;
  onCancel: () => void;
}

export function LeadValidationAlert({ duplicates, canOverride, onOverride, onCancel }: Props) {
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Possível duplicidade encontrada</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <ul className="text-sm space-y-1">
          {duplicates.map((d) => (
            <li key={d.id}>
              <strong>{d.full_name}</strong>
              {d.email && <span> · {d.email}</span>}
              {d.phone && <span> · {d.phone}</span>}
            </li>
          ))}
        </ul>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          {canOverride && (
            <Button variant="destructive" size="sm" onClick={onOverride}>
              Criar mesmo assim
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
