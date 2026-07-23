import type { Role } from "@/generated/prisma/enums";
import type { Session } from "next-auth";

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

export const ADMIN_ROLES: Role[] = ["SYSTEM_ADMIN"];
export const MANAGEMENT_ROLES: Role[] = ["SYSTEM_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"];
export const TEACHER_ROLES: Role[] = ["TEACHER"];
export const INITIATIVE_CREATOR_ROLES: Role[] = ["TEACHER", "INITIATIVE_OWNER", "TEAM_LEADER"];
export const TEAM_CREATOR_ROLES: Role[] = ["TEACHER", "TEAM_LEADER", "PRINCIPAL", "VICE_PRINCIPAL"];

export const ROUTE_ROLE_MAP: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/admin", roles: MANAGEMENT_ROLES },
  { prefix: "/schedule", roles: TEACHER_ROLES },
  { prefix: "/lesson-plans", roles: TEACHER_ROLES },
  { prefix: "/assessments", roles: TEACHER_ROLES },
];
