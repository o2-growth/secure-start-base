import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { PhaseGuardDialog } from "./PhaseGuardDialog";
import { useMoveCard, MissingFieldsError, type MissingField } from "@/hooks/useMoveCard";
import type { BoardPhase } from "@/hooks/usePipelineBoard";

interface KanbanBoardProps {
  phases: BoardPhase[];
  pipelineId: string;
  onCardClick: (cardId: string) => void;
}

export function KanbanBoard({ phases, pipelineId, onCardClick }: KanbanBoardProps) {
  const moveCard = useMoveCard();
  const [guardOpen, setGuardOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const cardId = active.id as string;
      const overId = over.id as string;

      // Find current phase of the dragged card
      const currentPhase = phases.find((p) =>
        p.cards.some((c) => c.id === cardId)
      );
      if (!currentPhase) return;

      // over.id can be a phase ID or a card ID (when dropped on another card)
      const targetPhase =
        phases.find((p) => p.id === overId) ??
        phases.find((p) => p.cards.some((c) => c.id === overId));

      if (!targetPhase || currentPhase.id === targetPhase.id) return;

      moveCard.mutate(
        {
          cardId,
          targetPhaseId: targetPhase.id,
          targetPhaseName: targetPhase.name,
        },
        {
          onError: (err: Error) => {
            if (err instanceof MissingFieldsError) {
              setMissingFields(err.missingFields);
              setGuardOpen(true);
            }
          },
        }
      );
    },
    [phases, pipelineId, moveCard]
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {phases.map((phase) => (
            <KanbanColumn
              key={phase.id}
              phase={phase}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      </DndContext>

      <PhaseGuardDialog
        open={guardOpen}
        onOpenChange={setGuardOpen}
        missingFields={missingFields}
      />
    </>
  );
}
