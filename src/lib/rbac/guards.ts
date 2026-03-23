import { type AppRole, hasPermission, type Permission } from "./permissions";

/**
 * Guard that throws if user doesn't have the required permission.
 * Use in service layer before mutations.
 */
export function requirePermission(role: AppRole | null, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permissão negada: ${permission}`);
  }
}

/**
 * Guard that checks if user can access a specific BU.
 * Admin/enablement can access all BUs.
 */
export function canAccessBU(
  role: AppRole | null,
  userBUId: string | null,
  targetBUId: string
): boolean {
  if (!role) return false;
  if (role === "admin" || role === "enablement") return true;
  return userBUId === targetBUId;
}

/**
 * Guard for card editing - closer can only edit their own cards
 */
export function canEditCard(
  role: AppRole | null,
  userProfileId: string,
  cardOwnerProfileId: string | null
): boolean {
  if (!role) return false;
  if (role === "admin" || role === "enablement" || role === "head") return true;
  if (role === "closer") return cardOwnerProfileId === userProfileId;
  // sdr/bdr can edit own cards
  return cardOwnerProfileId === userProfileId;
}
