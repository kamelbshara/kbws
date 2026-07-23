import type { Role } from "@/generated/prisma/enums";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Throws if there is no session or the user's role isn't in `allowed`.
 * Call this at the top of every Server Action / Route Handler that mutates
 * or reads privileged data — proxy.ts only fast-fails at the page level.
 */
export function requireRole(session: Session | null, allowed: Role[]): Session {
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  if (!allowed.includes(session.user.role)) {
    throw new ForbiddenError(`Role ${session.user.role} is not permitted to perform this action`);
  }
  return session;
}

/**
 * Static, always-on fallback for the roles allowed to manage the permission
 * templates themselves. This intentionally never goes through the dynamic
 * PermissionGroup lookup below — if it did, a misconfigured "ADMIN_ROLES"
 * group in the database could permanently lock every admin out of the one
 * screen that could fix it. Every other group is safely reconfigurable.
 */
export const ADMIN_ROLES: Role[] = ["SYSTEM_ADMIN"];

export const PERMISSION_GROUP_NAMES = [
  "ADMIN_ROLES",
  "MANAGEMENT_ROLES",
  "TEACHER_ROLES",
  "INITIATIVE_CREATOR_ROLES",
  "TEAM_CREATOR_ROLES",
] as const;
export type PermissionGroupName = (typeof PERMISSION_GROUP_NAMES)[number];

/** Default role membership for each group — matches this app's original hardcoded behavior exactly. */
export const DEFAULT_PERMISSION_GROUPS: Record<PermissionGroupName, Role[]> = {
  ADMIN_ROLES: ["SYSTEM_ADMIN"],
  MANAGEMENT_ROLES: ["SYSTEM_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"],
  TEACHER_ROLES: ["TEACHER"],
  INITIATIVE_CREATOR_ROLES: ["TEACHER", "INITIATIVE_OWNER", "TEAM_LEADER"],
  TEAM_CREATOR_ROLES: ["TEACHER", "TEAM_LEADER", "PRINCIPAL", "VICE_PRINCIPAL"],
};

const CACHE_TTL_MS = 30_000;
let cache: { groups: Record<PermissionGroupName, Role[]>; expiresAt: number } | null = null;

async function loadGroups(): Promise<Record<PermissionGroupName, Role[]>> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.groups;
  }
  const rows = await prisma.permissionGroup.findMany();
  const groups = { ...DEFAULT_PERMISSION_GROUPS };
  for (const row of rows) {
    if ((PERMISSION_GROUP_NAMES as readonly string[]).includes(row.name)) {
      groups[row.name as PermissionGroupName] = row.roles;
    }
  }
  cache = { groups, expiresAt: Date.now() + CACHE_TTL_MS };
  return groups;
}

/** Invalidate the in-memory permission cache — call after saving a group so the change takes effect immediately. */
export function invalidatePermissionCache(): void {
  cache = null;
}

export async function getRoleGroup(name: PermissionGroupName): Promise<Role[]> {
  const groups = await loadGroups();
  return groups[name];
}

/**
 * Async, database-backed counterpart to requireRole — checks membership in a
 * named, admin-configurable permission group instead of a hardcoded array.
 */
export async function requireRoleGroup(session: Session | null, groupName: PermissionGroupName): Promise<Session> {
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  const allowed = await getRoleGroup(groupName);
  if (!allowed.includes(session.user.role)) {
    throw new ForbiddenError(`Role ${session.user.role} is not permitted to perform this action`);
  }
  return session;
}

export const ROUTE_ROLE_GROUP_MAP: Array<{ prefix: string; group: PermissionGroupName }> = [
  { prefix: "/admin", group: "MANAGEMENT_ROLES" },
  { prefix: "/schedule", group: "TEACHER_ROLES" },
  { prefix: "/lesson-plans", group: "TEACHER_ROLES" },
  { prefix: "/assessments", group: "TEACHER_ROLES" },
];
