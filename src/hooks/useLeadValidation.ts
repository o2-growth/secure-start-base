import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DuplicateLead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
}

export function useLeadValidation() {
  const [duplicates, setDuplicates] = useState<DuplicateLead[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkDuplicates = async (
    organizationId: string,
    email?: string,
    phone?: string,
    document?: string
  ): Promise<DuplicateLead[]> => {
    setIsChecking(true);
    try {
      const filters: string[] = [];
      if (email?.trim()) filters.push(`email.eq.${email.trim()}`);
      if (phone?.trim()) filters.push(`phone.eq.${phone.trim()}`);
      if (document?.trim()) filters.push(`document.eq.${document.trim()}`);

      if (filters.length === 0) {
        setDuplicates([]);
        return [];
      }

      const { data, error } = await supabase
        .from("leads")
        .select("id, full_name, email, phone, document")
        .eq("organization_id", organizationId)
        .or(filters.join(","));

      if (error) throw error;
      const found = (data ?? []) as DuplicateLead[];
      setDuplicates(found);
      return found;
    } finally {
      setIsChecking(false);
    }
  };

  const clearDuplicates = () => setDuplicates([]);

  return { duplicates, isChecking, checkDuplicates, clearDuplicates };
}
