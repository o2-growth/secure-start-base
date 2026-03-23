import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DuplicateLead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
}

export interface ValidationResult {
  duplicates: DuplicateLead[];
  can_override: boolean;
}

export function useLeadValidation() {
  const [duplicates, setDuplicates] = useState<DuplicateLead[]>([]);
  const [canOverride, setCanOverride] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkDuplicates = async (
    organizationId: string,
    email?: string,
    phone?: string,
    document?: string
  ): Promise<ValidationResult> => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-lead", {
        body: { organization_id: organizationId, email, phone, document },
      });

      if (error) throw error;

      const result: ValidationResult = {
        duplicates: data.duplicates ?? [],
        can_override: data.can_override ?? false,
      };

      setDuplicates(result.duplicates);
      setCanOverride(result.can_override);
      return result;
    } finally {
      setIsChecking(false);
    }
  };

  const clearDuplicates = () => {
    setDuplicates([]);
    setCanOverride(false);
  };

  return { duplicates, canOverride, isChecking, checkDuplicates, clearDuplicates };
}
