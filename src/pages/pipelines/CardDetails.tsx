import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCard } from "@/hooks/useCard";
import { useMoveCard, MissingFieldsError } from "@/hooks/useMoveCard";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/AppShell";
import { CardForm } from "@/components/CardForm";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { AutomationLogTable } from "@/components/AutomationLogTable";
import { PhaseGuardDialog } from "@/components/PhaseGuardDialog";
import { CardContractPanel } from "@/components/CardContractPanel";
import { CardMeetingPanel } from "@/components/CardMeetingPanel";
import { CardMessagePanel } from "@/components/CardMessagePanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ArrowLeft, StickyNote, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import type { MissingField } from "@/hooks/useMoveCard";

export default function CardDetails() {
  const { pipelineId, cardId } = useParams<{ pipelineId: string; cardId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile } = useCurrentProfile();
  const { card, fields, fieldValues, activities, phases, isLoading, error, refetch } = useCard(cardId);
  const moveCard = useMoveCard();

  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState("");
  const [guardOpen, setGuardOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);

  const lead = card?.leads as any;
  const currentPhase = card?.pipeline_phases as any;
  const owner = card?.profiles as any;

  const handleAddNote = async () => {
    if (!noteText.trim() || !cardId) return;
    setAddingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("activities").insert({
        card_id: cardId,
        type: "note",
        payload: { text: noteText.trim() },
        created_by: user?.id ?? null,
      });
      setNoteText("");
      refetch();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setAddingNote(false);
    }
  };

  const handleMovePhase = () => {
    if (!selectedPhase || !cardId) return;
    const phase = phases.find((p) => p.id === selectedPhase);
    moveCard.mutate(
      { cardId, targetPhaseId: selectedPhase, targetPhaseName: phase?.name ?? "" },
      {
        onSuccess: () => { setSelectedPhase(""); refetch(); },
        onError: (err: Error) => {
          if (err instanceof MissingFieldsError) {
            setMissingFields(err.missingFields);
            setGuardOpen(true);
          }
        },
      }
    );
  };

  const STATUS_LABELS: Record<string, string> = {
    open: "Aberto",
    won: "Ganho",
    lost: "Perdido",
    archived: "Arquivado",
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px]" />
        </div>
      </AppShell>
    );
  }

  if (error || !card) {
    return (
      <AppShell>
        <div className="flex items-center gap-2 text-destructive p-8">
          <AlertCircle className="h-5 w-5" />
          <p>Card não encontrado.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/pipelines/${pipelineId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {lead?.full_name ?? "Lead"}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary">{currentPhase?.name ?? "—"}</Badge>
              <Badge variant="outline">{STATUS_LABELS[card.status] ?? card.status}</Badge>
              {owner?.full_name && (
                <span className="text-xs text-muted-foreground">
                  Responsável: {owner.full_name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações do Lead</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                {lead?.email && <div><span className="text-muted-foreground">Email:</span> {lead.email}</div>}
                {lead?.phone && <div><span className="text-muted-foreground">Tel:</span> {lead.phone}</div>}
                {lead?.document && <div><span className="text-muted-foreground">Doc:</span> {lead.document}</div>}
                {lead?.company_name && <div><span className="text-muted-foreground">Empresa:</span> {lead.company_name}</div>}
                {lead?.source && <div><span className="text-muted-foreground">Origem:</span> {lead.source}</div>}
              </CardContent>
            </Card>

            {/* Custom Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campos do Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <CardForm
                  cardId={card.id}
                  fields={fields}
                  values={fieldValues}
                  onSaved={refetch}
                />
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Atividades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Adicionar nota..."
                    className="text-sm min-h-[60px]"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || addingNote}
                    className="shrink-0 self-end"
                  >
                    {addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <StickyNote className="h-4 w-4" />}
                  </Button>
                </div>
                <ActivityTimeline activities={activities} />
              </CardContent>
            </Card>

            {/* Automation Runs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Automações</CardTitle>
              </CardHeader>
              <CardContent>
                <AutomationLogTable cardId={cardId} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Move Phase */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Mover Fase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar fase..." />
                  </SelectTrigger>
                  <SelectContent>
                    {phases
                      .filter((p) => p.id !== card.current_phase_id)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleMovePhase}
                  disabled={!selectedPhase || moveCard.isPending}
                  className="w-full"
                  size="sm"
                >
                  {moveCard.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  Mover
                </Button>
              </CardContent>
            </Card>

            {/* Contract Panel */}
            <CardContractPanel
              cardId={card.id}
              contractStatus={card.contract_status}
              canGenerate={
                profile?.role === "admin" ||
                profile?.role === "enablement" ||
                profile?.role === "closer"
              }
            />

            {/* Meeting Panel */}
            <CardMeetingPanel cardId={card.id} />

            {/* Communication Panel */}
            <CardMessagePanel cardId={card.id} leadPhone={lead?.phone} />
          </div>
        </div>
      </div>

      <PhaseGuardDialog
        open={guardOpen}
        onOpenChange={setGuardOpen}
        missingFields={missingFields}
      />
    </AppShell>
  );
}
