import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBusinessUnits() {
  return useQuery({
    queryKey: ["business-units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_units")
        .select("*, organizations(name, type)")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}
