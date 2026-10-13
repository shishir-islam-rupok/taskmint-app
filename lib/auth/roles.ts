export const ROLE_VALUES = [
  "user",
  "advertiser",
  "reviewer",
  "support",
  "finance",
  "admin",
] as const;

export type UserRole = (typeof ROLE_VALUES)[number];

export function hasAnyRole(userRoles: readonly string[] | undefined, roles: readonly UserRole[]) {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  return userRoles.some((role) => roles.includes(role as UserRole));
}

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) {
    return null;
  }

  return ROLE_VALUES.includes(role as UserRole) ? (role as UserRole) : null;
}

export const DEFAULT_ROLE = "user" as const;
