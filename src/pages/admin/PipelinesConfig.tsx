import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Pencil, Kanban, Layers, ListChecks } from "lucide-react";
import {
  useAdminPipelines,
  useCreatePipeline,
  useUpdatePipeline,
  useCreatePhase,
  useUpdatePhase,
  useCreateField,
  useUpdateField,
} from "@/hooks/useAdminPipelines";
import { useAdminBUs } from "@/hooks/useAdminBUs";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type FieldType = Database["public"]["Enums"]["field_type"];
const FIELD_TYPES: FieldType[] = ["text", "number", "email", "phone", "date", "select", "multiselect", "textarea", "checkbox", "url"];

export default function PipelinesConfig() {
  const { data: pipelines, isLoading } = useAdminPipelines();
  const { data: bus } = useAdminBUs();
  const createPipeline = useCreatePipeline();
  const updatePipeline = useUpdatePipeline();
  const createPhase = useCreatePhase();
  const updatePhase = useUpdatePhase();
  const createField = useCreateField();
  const updateField = useUpdateField();

  // Pipeline dialog
  const [pipeDialog, setPipeDialog] = useState(false);
  const [pipeName, setPipeName] = useState("");
  const [pipeBU, setPipeBU] = useState("");
  const [pipeAudience, setPipeAudience] = useState<"internal" | "franchise">("internal");

  // Phase dialog
  const [phaseDialog, setPhaseDialog] = useState(false);
  const [phasePipelineId, setPhasePipelineId] = useState("");
  const [phaseName, setPhaseName] = useState("");
  const [phasePosition, setPhasePosition] = useState(0);
  const [phaseIsFinal, setPhaseIsFinal] = useState(false);
  const [phaseEditId, setPhaseEditId] = useState<string | null>(null);

  // Field dialog
  const [fieldDialog, setFieldDialog] = useState(false);
  const [fieldPipelineId, setFieldPipelineId] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldPhaseId, setFieldPhaseId] = useState<string | null>(null);
  const [fieldEditId, setFieldEditId] = useState<string | null>(null);

  const handleCreatePipeline = () => {
    if (!pipeName || !pipeBU) return toast.error("Preencha todos os campos");
    createPipeline.mutate({ name: pipeName, business_unit_id: pipeBU, audience: pipeAudience }, {
      onSuccess: () => { toast.success("Pipeline criado"); setPipeDialog(false); },
      onError: (e) => toast.error(e.message),
    });
  };

  const openPhaseDialog = (pipelineId: string, existing?: any) => {
    setPhasePipelineId(pipelineId);
    if (existing) {
      setPhaseEditId(existing.id);
      setPhaseName(existing.name);
      setPhasePosition(existing.position);
      setPhaseIsFinal(existing.is_final);
    } else {
      setPhaseEditId(null);
      setPhaseName("");
      setPhasePosition(0);
      setPhaseIsFinal(false);
    }
    setPhaseDialog(true);
  };

  const handleSavePhase = () => {
    if (!phaseName) return toast.error("Nome obrigatório");
    if (phaseEditId) {
      updatePhase.mutate({ id: phaseEditId, name: phaseName, position: phasePosition, is_final: phaseIsFinal }, {
        onSuccess: () => { toast.success("Fase atualizada"); setPhaseDialog(false); },
        onError: (e) => toast.error(e.message),
      });
    } else {
      createPhase.mutate({ pipeline_id: phasePipelineId, name: phaseName, position: phasePosition, is_final: phaseIsFinal }, {
        onSuccess: () => { toast.success("Fase criada"); setPhaseDialog(false); },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  const openFieldDialog = (pipelineId: string, existing?: any) => {
    setFieldPipelineId(pipelineId);
    if (existing) {
      setFieldEditId(existing.id);
      setFieldLabel(existing.label);
      setFieldKey(existing.key);
      setFieldType(existing.type);
      setFieldRequired(existing.required);
      setFieldPhaseId(existing.phase_id);
    } else {
      setFieldEditId(null);
      setFieldLabel("");
      setFieldKey("");
      setFieldType("text");
      setFieldRequired(false);
      setFieldPhaseId(null);
    }
    setFieldDialog(true);
  };

  const handleSaveField = () => {
    if (!fieldLabel || !fieldKey) return toast.error("Label e key obrigatórios");
    if (fieldEditId) {
      updateField.mutate({ id: fieldEditId, label: fieldLabel, key: fieldKey, type: fieldType, required: fieldRequired, phase_id: fieldPhaseId }, {
        onSuccess: () => { toast.success("Campo atualizado"); setFieldDialog(false); },
        onError: (e) => toast.error(e.message),
      });
    } else {
      createField.mutate({ pipeline_id: fieldPipelineId, label: fieldLabel, key: fieldKey, type: fieldType, required: fieldRequired, phase_id: fieldPhaseId }, {
        onSuccess: () => { toast.success("Campo criado"); setFieldDialog(false); },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuração de Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerenciar pipelines, fases e campos</p>
        </div>
        <Button size="sm" onClick={() => { setPipeName(""); setPipeBU(""); setPipeDialog(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Novo Pipeline
        </Button>
      </div>

      {/* Pipeline create dialog */}
      <Dialog open={pipeDialog} onOpenChange={setPipeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Pipeline</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={pipeName} onChange={(e) => setPipeName(e.target.value)} /></div>
            <div>
              <Label>Business Unit</Label>
              <Select value={pipeBU} onValueChange={setPipeBU}>
                <SelectTrigger><SelectValue placeholder="Selecionar BU" /></SelectTrigger>
                <SelectContent>
                  {bus?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Audiência</Label>
              <Select value={pipeAudience} onValueChange={(v: any) => setPipeAudience(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="franchise">Franquia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreatePipeline} disabled={createPipeline.isPending} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phase dialog */}
      <Dialog open={phaseDialog} onOpenChange={setPhaseDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{phaseEditId ? "Editar Fase" : "Nova Fase"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={phaseName} onChange={(e) => setPhaseName(e.target.value)} /></div>
            <div><Label>Posição</Label><Input type="number" value={phasePosition} onChange={(e) => setPhasePosition(Number(e.target.value))} /></div>
            <div className="flex items-center gap-2"><Switch checked={phaseIsFinal} onCheckedChange={setPhaseIsFinal} /><Label>Fase final</Label></div>
            <Button onClick={handleSavePhase} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Field dialog */}
      <Dialog open={fieldDialog} onOpenChange={setFieldDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{fieldEditId ? "Editar Campo" : "Novo Campo"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Label</Label><Input value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} /></div>
            <div><Label>Key</Label><Input value={fieldKey} onChange={(e) => setFieldKey(e.target.value)} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={fieldType} onValueChange={(v: any) => setFieldType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Switch checked={fieldRequired} onCheckedChange={setFieldRequired} /><Label>Obrigatório</Label></div>
            <Button onClick={handleSaveField} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pipelines accordion */}
      <Accordion type="multiple" className="space-y-3">
        {pipelines?.map((pipe) => {
          const phases = (pipe.pipeline_phases as any[] ?? []).sort((a: any, b: any) => a.position - b.position);
          const fields = (pipe.pipeline_fields as any[] ?? []).sort((a: any, b: any) => a.position - b.position);

          return (
            <AccordionItem key={pipe.id} value={pipe.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Kanban className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{pipe.name}</span>
                  <Badge variant="outline">{(pipe.business_units as any)?.name}</Badge>
                  <Badge variant="secondary">{pipe.audience}</Badge>
                  {!pipe.active && <Badge variant="destructive">Inativo</Badge>}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 space-y-6">
                {/* Phases */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1"><Layers className="h-4 w-4" /> Fases</h3>
                    <Button variant="outline" size="sm" onClick={() => openPhaseDialog(pipe.id)}>
                      <Plus className="h-3 w-3 mr-1" /> Fase
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {phases.map((ph: any) => (
                      <div key={ph.id} className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/50 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-6">{ph.position}</span>
                          <span>{ph.name}</span>
                          {ph.is_final && <Badge variant="secondary" className="text-xs">Final</Badge>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPhaseDialog(pipe.id, ph)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {phases.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma fase.</p>}
                  </div>
                </div>

                {/* Fields */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold flex items-center gap-1"><ListChecks className="h-4 w-4" /> Campos</h3>
                    <Button variant="outline" size="sm" onClick={() => openFieldDialog(pipe.id)}>
                      <Plus className="h-3 w-3 mr-1" /> Campo
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Label</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Obrigatório</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((f: any) => (
                        <TableRow key={f.id}>
                          <TableCell>{f.label}</TableCell>
                          <TableCell><code className="text-xs">{f.key}</code></TableCell>
                          <TableCell><Badge variant="outline">{f.type}</Badge></TableCell>
                          <TableCell>{f.required ? "Sim" : "Não"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openFieldDialog(pipe.id, f)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {fields.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum campo.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {(!pipelines || pipelines.length === 0) && (
        <Card><CardContent className="flex flex-col items-center justify-center py-12">
          <Kanban className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum pipeline encontrado.</p>
        </CardContent></Card>
      )}
    </div>
  );
}
