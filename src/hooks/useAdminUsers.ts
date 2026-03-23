import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/rbac/permissions";

export interface AdminUser {
  id: string;
  authUserId: string;
  fullName: string;
  email: string;
  organizationId: string;
  businessUnitId: string | null;
  active: boolean;
  role: AppRole | null;
  orgName: string;
  buName: string | null;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<AdminUser[]> => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*, organizations(name), business_units(name)")
        .order("full_name");
      if (error) throw error;

      const { data: roles } = await supabase.from("user_roles").select("*");
      const roleMap = new Map<string, AppRole>();
      roles?.forEach((r) => roleMap.set(r.user_id, r.role as AppRole));

      return (profiles ?? []).map((p) => ({
        id: p.id,
        authUserId: p.auth_user_id,
        fullName: p.full_name,
        email: p.email,
        organizationId: p.organization_id,
        businessUnitId: p.business_unit_id,
        active: p.active,
        role: roleMap.get(p.auth_user_id) ?? null,
        orgName: (p.organizations as any)?.name ?? "",
        buName: (p.business_units as any)?.name ?? null,
      }));
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Upsert: delete old then insert new
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, active }: { profileId: string; active: boolean }) => {
      const { error } = await supabase.from("profiles").update({ active }).eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}
