import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntegrationStatusCard } from "@/components/IntegrationStatusCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Puzzle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Provider = "brevo" | "whatsapp_official" | "google_meet" | "elephan" | "contracts";
const PROVIDERS: Provider[] = ["brevo", "whatsapp_official", "google_meet", "elephan", "contracts"];
const PROVIDER_LABELS: Record<Provider, string> = {
  brevo: "Brevo",
  whatsapp_official: "WhatsApp API",
  google_meet: "Google Meet",
  elephan: "Elephan IA",
  contracts: "Contratos",
};

function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_connections")
        .select("*, organizations(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useCreateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conn: { provider: Provider; organization_id?: string | null; config_json?: string | null }) => {
      const payload: any = { provider: conn.provider };
      if (conn.organization_id) payload.organization_id = conn.organization_id;
      if (conn.config_json?.trim()) {
        try {
          payload.encrypted_config = JSON.parse(conn.config_json);
        } catch {
          payload.encrypted_config = conn.config_json;
        }
      }
      const { error } = await supabase.from("integration_connections").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });
}

function useUpdateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; active?: boolean }) => {
      const { error } = await supabase.from("integration_connections").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });
}

export default function Integrations() {
  const { data: connections, isLoading } = useIntegrations();
  const createConn = useCreateIntegration();
  const updateConn = useUpdateIntegration();
  const [dialog, setDialog] = useState(false);
  const [provider, setProvider] = useState<Provider>("brevo");
  const [configJson, setConfigJson] = useState("");

  const handleCreate = () => {
    createConn.mutate({ provider, config_json: configJson }, {
      onSuccess: () => { toast.success("Integração criada"); setDialog(false); setConfigJson(""); },
      onError: (e) => toast.error(e.message),
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
          <p className="text-sm text-muted-foreground mt-1">Brevo, WhatsApp, Google Meet, Elephan, Contratos</p>
        </div>
        <Button size="sm" onClick={() => setDialog(true)}><Plus className="h-4 w-4 mr-1" /> Nova Integração</Button>
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Integração</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Provedor</Label>
              <Select value={provider} onValueChange={(v: any) => setProvider(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => <SelectItem key={p} value={p}>{PROVIDER_LABELS[p]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Configuração (JSON ou chave de API)</Label>
              <textarea
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[80px] resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={'{"api_key": "sua-chave-aqui"}'}
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Cole a chave de API ou um objeto JSON com as credenciais.</p>
            </div>
            <Button onClick={handleCreate} disabled={createConn.isPending} className="w-full">Criar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {connections && connections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn) => (
            <IntegrationStatusCard key={conn.id} connection={conn} />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Sync</TableHead>
                <TableHead>Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{PROVIDER_LABELS[c.provider as Provider] ?? c.provider}</TableCell>
                  <TableCell><Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{c.last_sync_at ? format(new Date(c.last_sync_at), "dd/MM/yyyy HH:mm") : "Nunca"}</TableCell>
                  <TableCell>
                    <Switch checked={c.active} onCheckedChange={(v) => updateConn.mutate({ id: c.id, active: v })} />
                  </TableCell>
                </TableRow>
              ))}
              {(!connections || connections.length === 0) && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  <Puzzle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  Nenhuma integração configurada.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
