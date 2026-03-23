import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/rbac/permissions";

export interface UserProfile {
  id: string;
  authUserId: string;
  fullName: string;
  email: string;
  organizationId: string;
  businessUnitId: string | null;
  role: AppRole | null;
  orgType: "hq" | "franchise";
  orgName: string;
  buName: string | null;
  active: boolean;
}

export function useCurrentProfile() {
  return useQuery({
    queryKey: ["current-profile"],
    queryFn: async (): Promise<UserProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*, organizations(name, type), business_units(name)")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) return null;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const primaryRole = roles?.[0]?.role as AppRole | null ?? null;
      const org = profile.organizations as any;
      const bu = profile.business_units as any;

      return {
        id: profile.id,
        authUserId: profile.auth_user_id,
        fullName: profile.full_name,
        email: profile.email,
        organizationId: profile.organization_id,
        businessUnitId: profile.business_unit_id,
        role: primaryRole,
        orgType: org?.type ?? "hq",
        orgName: org?.name ?? "",
        buName: bu?.name ?? null,
        active: profile.active,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
