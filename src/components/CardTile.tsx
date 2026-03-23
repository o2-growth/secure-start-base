import { memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { User, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BoardCard } from "@/hooks/usePipelineBoard";

interface CardTileProps {
  card: BoardCard;
  onClick: (id: string) => void;
}

function CardTileInner({ card, onClick }: CardTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(card.id)}
      className="rounded-md border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
    >
      <p className="font-medium text-sm text-foreground truncate">
        {card.leads?.full_name ?? "—"}
      </p>
      {card.leads?.company_name && (
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {card.leads.company_name}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="truncate max-w-[80px]">
            {card.owner?.full_name ?? "Sem dono"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{format(new Date(card.created_at), "dd/MM", { locale: ptBR })}</span>
        </div>
      </div>
      <div className="mt-2">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {card.origin}
        </Badge>
      </div>
    </div>
  );
}

export const CardTile = memo(CardTileInner);
