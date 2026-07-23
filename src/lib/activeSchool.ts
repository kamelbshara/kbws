import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

export const ACTIVE_SCHOOL_COOKIE = "ACTIVE_SCHOOL_ID";

/**
 * Resolves which school the current request should operate on.
 *
 * Almost every user belongs to exactly one school (session.user.schoolId) and is
 * permanently scoped to it — that's the normal, non-switchable case. The one
 * exception is a "platform admin": a SYSTEM_ADMIN created with no schoolId, who
 * can administer multiple schools and switches between them via a cookie (set
 * by SchoolSwitcher / setActiveSchoolAction). Falls back to the oldest school
 * if the platform admin hasn't picked one yet.
 */
export async function getActiveSchoolId(session: Session): Promise<string | null> {
  if (session.user.schoolId) {
    return session.user.schoolId;
  }
  if (session.user.role !== "SYSTEM_ADMIN") {
    return null;
  }

  const cookieStore = await cookies();
  const cookieSchoolId = cookieStore.get(ACTIVE_SCHOOL_COOKIE)?.value;
  if (cookieSchoolId) {
    const exists = await prisma.school.findUnique({ where: { id: cookieSchoolId }, select: { id: true } });
    if (exists) return exists.id;
  }

  const fallback = await prisma.school.findFirst({ orderBy: { createdAt: "asc" } });
  return fallback?.id ?? null;
}

export function isPlatformAdmin(session: Session): boolean {
  return session.user.role === "SYSTEM_ADMIN" && !session.user.schoolId;
}
