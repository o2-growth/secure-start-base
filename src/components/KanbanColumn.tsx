import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CardTile } from "./CardTile";
import { Badge } from "@/components/ui/badge";
import type { BoardPhase } from "@/hooks/usePipelineBoard";

interface KanbanColumnProps {
  phase: BoardPhase;
  onCardClick: (cardId: string) => void;
}

export function KanbanColumn({ phase, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: phase.id });

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {phase.name}
        </h3>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
          {phase.cards.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-lg border border-dashed p-2 space-y-2 min-h-[200px] transition-colors ${
          isOver ? "bg-accent/60 border-primary/40" : "bg-muted/30 border-border"
        }`}
      >
        <SortableContext
          items={phase.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {phase.cards.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Nenhum card
            </p>
          ) : (
            phase.cards.map((card) => (
              <CardTile key={card.id} card={card} onClick={onCardClick} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
