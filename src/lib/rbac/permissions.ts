import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  admin: 100,
  enablement: 90,
  head: 60,
  closer: 40,
  sdr: 30,
  bdr: 20,
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  enablement: "Enablement",
  head: "Head",
  closer: "Closer",
  sdr: "SDR",
  bdr: "BDR",
};

export type Permission =
  | "view_all_bus"
  | "manage_users"
  | "manage_pipelines"
  | "manage_phases"
  | "manage_fields"
  | "manage_automations"
  | "generate_contract"
  | "create_lead"
  | "move_card"
  | "edit_own_cards"
  | "edit_any_cards"
  | "view_integrations"
  | "manage_integrations"
  | "override_duplicate";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [
    "view_all_bus", "manage_users", "manage_pipelines", "manage_phases",
    "manage_fields", "manage_automations", "generate_contract", "create_lead",
    "move_card", "edit_any_cards", "view_integrations", "manage_integrations",
    "override_duplicate",
  ],
  enablement: [
    "view_all_bus", "manage_users", "manage_pipelines", "manage_phases",
    "manage_fields", "manage_automations", "create_lead", "move_card",
    "edit_any_cards", "view_integrations", "override_duplicate",
  ],
  head: ["create_lead", "move_card", "edit_any_cards"],
  closer: ["create_lead", "move_card", "edit_own_cards", "generate_contract"],
  sdr: ["create_lead", "move_card", "edit_own_cards"],
  bdr: ["create_lead", "move_card", "edit_own_cards"],
};

export function hasPermission(role: AppRole | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isAdminOrEnablement(role: AppRole | null): boolean {
  return role === "admin" || role === "enablement";
}

export function getRoleLabel(role: AppRole): string {
  return ROLE_LABELS[role] ?? role;
}
