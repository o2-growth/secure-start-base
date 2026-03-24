import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, FileText } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_FIELDS = ["full_name", "email", "phone", "document", "company_name", "source", "notes"];

function useStartForms() {
  return useQuery({
    queryKey: ["start_forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("start_forms")
        .select("*, pipelines(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function usePipelinesSimple() {
  return useQuery({
    queryKey: ["pipelines_simple"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function StartForms() {
  const qc = useQueryClient();
  const { data: forms, isLoading } = useStartForms();
  const { data: pipelines } = usePipelinesSimple();

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [formName, setFormName] = useState("");
  const [pipelineId, setPipelineId] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>(DEFAULT_FIELDS);
  const [active, setActive] = useState(true);

  const upsertForm = useMutation({
    mutationFn: async () => {
      const payload = {
        pipeline_id: pipelineId,
        name: formName,
        schema: { fields: selectedFields },
        active,
      };
      if (editing) {
        const { error } = await supabase.from("start_forms").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("start_forms").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["start_forms"] });
      toast.success(editing ? "Formulário atualizado" : "Formulário criado");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setPipelineId("");
    setSelectedFields(DEFAULT_FIELDS);
    setActive(true);
    setDialog(true);
  };

  const openEdit = (form: any) => {
    setEditing(form);
    setFormName(form.name);
    setPipelineId(form.pipeline_id);
    setSelectedFields((form.schema as any)?.fields ?? DEFAULT_FIELDS);
    setActive(form.active);
    setDialog(true);
  };

  const closeDialog = () => {
    setDialog(false);
    setEditing(null);
  };

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Start Forms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Formulários de cadastro inicial por pipeline
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Novo Formulário
        </Button>
      </div>

      <Dialog open={dialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Formulário" : "Novo Formulário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Cadastro Modelo Atual"
              />
            </div>
            <div>
              <Label>Pipeline</Label>
              <Select value={pipelineId} onValueChange={setPipelineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block mb-2">Campos visíveis</Label>
              <div className="space-y-2">
                {DEFAULT_FIELDS.map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <Switch
                      checked={selectedFields.includes(field)}
                      onCheckedChange={() => toggleField(field)}
                    />
                    <span className="text-sm font-mono">{field}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label>Ativo</Label>
            </div>
            <Button
              onClick={() => upsertForm.mutate()}
              disabled={upsertForm.isPending || !formName || !pipelineId}
              className="w-full"
            >
              {upsertForm.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {(!forms || forms.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum formulário configurado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form: any) => (
            <Card key={form.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{form.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={form.active ? "default" : "secondary"}>
                      {form.active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(form)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(form.pipelines as any)?.name ?? "Pipeline não encontrado"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {((form.schema as any)?.fields ?? []).map((f: string) => (
                    <Badge key={f} variant="outline" className="text-xs font-mono">{f}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
