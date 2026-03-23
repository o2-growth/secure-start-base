import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminBUs() {
  return useQuery({
    queryKey: ["admin-bus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_units")
        .select("*, organizations(name)")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateBU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bu: { name: string; slug: string; organization_id: string }) => {
      const { error } = await supabase.from("business_units").insert(bu);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bus"] }),
  });
}

export function useUpdateBU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; slug?: string; active?: boolean }) => {
      const { error } = await supabase.from("business_units").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-bus"] }),
  });
}
