// Server-side Supabase client — NEVER use in browser/frontend components
// Use only in build scripts, seed scripts, or server-side contexts
// For edge functions, use createClient directly from esm.sh

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set for server client"
  );
}

export const supabaseServer = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
