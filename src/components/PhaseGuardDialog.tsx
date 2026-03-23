import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { MissingField } from "@/hooks/useMoveCard";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missingFields: MissingField[];
}

export function PhaseGuardDialog({ open, onOpenChange, missingFields }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Campos obrigatórios
          </DialogTitle>
          <DialogDescription>
            Preencha os campos obrigatórios antes de mover o card para esta fase.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-1 text-sm">
          {missingFields.map((f) => (
            <li key={f.id} className="flex items-center gap-2 text-destructive">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
              {f.label}
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
