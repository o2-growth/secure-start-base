import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Zap, History } from "lucide-react";
import { useAutomationRules, useAutomationRuns, useCreateAutomationRule, useUpdateAutomationRule } from "@/hooks/useAutomationRules";
import { usePipelines } from "@/hooks/usePipelines";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Trigger = Database["public"]["Enums"]["automation_trigger"];
const TRIGGERS: Trigger[] = ["card_created", "phase_enter", "delay_elapsed", "meeting_finished"];

const TRIGGER_LABELS: Record<Trigger, string> = {
  card_created: "Card Criado",
  phase_enter: "Entrada na Fase",
  delay_elapsed: "Tempo Decorrido",
  meeting_finished: "Reunião Finalizada",
};

export default function AutomationRules() {
  const { data: rules, isLoading } = useAutomationRules();
  const { data: pipelines } = usePipelines();
  const createRule = useCreateAutomationRule();
  const updateRule = useUpdateAutomationRule();

  const [dialog, setDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pipelineId, setPipelineId] = useState("");
  const [triggerType, setTriggerType] = useState<Trigger>("card_created");
  const [conditions, setConditions] = useState("{}");
  const [actions, setActions] = useState("{}");
  const [active, setActive] = useState(true);

  // Runs viewer
  const [runsRuleId, setRunsRuleId] = useState<string | undefined>();
  const [runsDialog, setRunsDialog] = useState(false);
  const { data: runs, isLoading: runsLoading } = useAutomationRuns(runsRuleId);

  const openCreate = () => {
    setEditId(null);
    setPipelineId("");
    setTriggerType("card_created");
    setConditions("{}");
    setActions("{}");
    setActive(true);
    setDialog(true);
  };

  const openEdit = (rule: any) => {
    setEditId(rule.id);
    setPipelineId(rule.pipeline_id);
    setTriggerType(rule.trigger_type);
    setConditions(JSON.stringify(rule.conditions, null, 2));
    setActions(JSON.stringify(rule.actions, null, 2));
    setActive(rule.active);
    setDialog(true);
  };

  const handleSave = () => {
    let parsedConditions, parsedActions;
    try {
      parsedConditions = JSON.parse(conditions);
      parsedActions = JSON.parse(actions);
    } catch {
      return toast.error("JSON inválido");
    }

    if (editId) {
      updateRule.mutate({ id: editId, trigger_type: triggerType, conditions: parsedConditions, actions: parsedActions, active }, {
        onSuccess: () => { toast.success("Regra atualizada"); setDialog(false); },
        onError: (e) => toast.error(e.message),
      });
    } else {
      if (!pipelineId) return toast.error("Selecione um pipeline");
      createRule.mutate({ pipeline_id: pipelineId, trigger_type: triggerType, conditions: parsedConditions, actions: parsedActions, active }, {
        onSuccess: () => { toast.success("Regra criada"); setDialog(false); },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automações</h1>
          <p className="text-sm text-muted-foreground mt-1">Regras de automação e follow-ups</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nova Regra</Button>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editar Regra" : "Nova Regra"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editId && (
              <div>
                <Label>Pipeline</Label>
                <Select value={pipelineId} onValueChange={setPipelineId}>
                  <SelectTrigger><SelectValue placeholder="Selecionar pipeline" /></SelectTrigger>
                  <SelectContent>
                    {pipelines?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Gatilho</Label>
              <Select value={triggerType} onValueChange={(v: any) => setTriggerType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => <SelectItem key={t} value={t}>{TRIGGER_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Condições (JSON)</Label><Textarea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={3} className="font-mono text-xs" /></div>
            <div><Label>Ações (JSON)</Label><Textarea value={actions} onChange={(e) => setActions(e.target.value)} rows={3} className="font-mono text-xs" /></div>
            <div className="flex items-center gap-2"><Switch checked={active} onCheckedChange={setActive} /><Label>Ativo</Label></div>
            <Button onClick={handleSave} disabled={createRule.isPending || updateRule.isPending} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Runs dialog */}
      <Dialog open={runsDialog} onOpenChange={setRunsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Execuções da Regra</DialogTitle></DialogHeader>
          {runsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Executado em</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant={r.status === "success" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.executed_at ? format(new Date(r.executed_at), "dd/MM/yyyy HH:mm") : "—"}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">{r.error_message ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {(!runs || runs.length === 0) && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhuma execução.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Rules table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline</TableHead>
                <TableHead>Gatilho</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{(r.pipelines as any)?.name ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{TRIGGER_LABELS[r.trigger_type as Trigger] ?? r.trigger_type}</Badge></TableCell>
                  <TableCell>
                    <Switch checked={r.active} onCheckedChange={(v) => updateRule.mutate({ id: r.id, active: v })} />
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRunsRuleId(r.id); setRunsDialog(true); }}>
                      <History className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!rules || rules.length === 0) && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  Nenhuma regra de automação.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
