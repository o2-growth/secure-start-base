import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Pencil, Building2 } from "lucide-react";
import { useAdminBUs, useCreateBU, useUpdateBU } from "@/hooks/useAdminBUs";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { toast } from "sonner";

export default function BusinessUnits() {
  const { data: bus, isLoading, error } = useAdminBUs();
  const { data: profile } = useCurrentProfile();
  const createBU = useCreateBU();
  const updateBU = useUpdateBU();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const handleSave = () => {
    if (!name.trim() || !slug.trim()) return toast.error("Preencha nome e slug");
    if (editingId) {
      updateBU.mutate({ id: editingId, name, slug }, {
        onSuccess: () => { toast.success("BU atualizada"); setOpen(false); },
        onError: (e) => toast.error(e.message),
      });
    } else {
      if (!profile?.organizationId) return;
      createBU.mutate({ name, slug, organization_id: profile.organizationId }, {
        onSuccess: () => { toast.success("BU criada"); setOpen(false); },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  const openEdit = (bu: any) => {
    setEditingId(bu.id);
    setName(bu.name);
    setSlug(bu.slug);
    setOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setOpen(true);
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Business Units</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerenciar unidades de negócio</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nova BU</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar BU" : "Nova BU"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
              <Button onClick={handleSave} disabled={createBU.isPending || updateBU.isPending} className="w-full">
                {(createBU.isPending || updateBU.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bus?.map((bu) => (
                <TableRow key={bu.id}>
                  <TableCell className="font-medium">{bu.name}</TableCell>
                  <TableCell><Badge variant="outline">{bu.slug}</Badge></TableCell>
                  <TableCell>{(bu.organizations as any)?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Switch checked={bu.active} onCheckedChange={(v) => updateBU.mutate({ id: bu.id, active: v })} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(bu)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!bus || bus.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma BU encontrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
