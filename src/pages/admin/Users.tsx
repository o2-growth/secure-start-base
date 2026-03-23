import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users } from "lucide-react";
import { useAdminUsers, useUpdateUserRole, useToggleUserActive } from "@/hooks/useAdminUsers";
import { ROLE_LABELS, type AppRole } from "@/lib/rbac/permissions";
import { toast } from "sonner";

const ROLES: AppRole[] = ["admin", "enablement", "head", "closer", "sdr", "bdr"];

export default function AdminUsers() {
  const { data: users, isLoading, error } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const toggleActive = useToggleUserActive();

  const handleRoleChange = (userId: string, role: AppRole) => {
    updateRole.mutate({ userId, role }, {
      onSuccess: () => toast.success("Perfil atualizado"),
      onError: (e) => toast.error(e.message),
    });
  };

  const handleToggleActive = (profileId: string, active: boolean) => {
    toggleActive.mutate({ profileId, active }, {
      onSuccess: () => toast.success("Status atualizado"),
      onError: (e) => toast.error(e.message),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <Card><CardContent className="py-8 text-center text-destructive">Erro ao carregar usuários.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerenciar usuários e permissões</p>
        </div>
        <Badge variant="secondary">{users?.length ?? 0} usuários</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>BU</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Ativo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{u.orgName}</TableCell>
                  <TableCell>{u.buName ?? "—"}</TableCell>
                  <TableCell>
                    <Select value={u.role ?? ""} onValueChange={(v) => handleRoleChange(u.authUserId, v as AppRole)}>
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Switch checked={u.active} onCheckedChange={(v) => handleToggleActive(u.id, v)} />
                  </TableCell>
                </TableRow>
              ))}
              {(!users || users.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
