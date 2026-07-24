import { prisma } from "@/lib/prisma";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import type { Session } from "next-auth";
import type { Initiative } from "@/generated/prisma/client";

/** Owner, assignee, or management (same school) -- the shared read/write access rule for initiatives. */
export async function canAccessInitiative(initiative: Initiative, session: Session): Promise<boolean> {
  if (initiative.ownerId === session.user.id || initiative.assignedToId === session.user.id) {
    return true;
  }
  const schoolId = await getActiveSchoolId(session);
  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(session.user.role);
  return isManagement && initiative.schoolId === schoolId;
}

export async function findAccessibleInitiative(initiativeId: string, session: Session) {
  const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
  if (!initiative || !(await canAccessInitiative(initiative, session))) {
    return null;
  }
  return initiative;
}

/** Only the owner or the assignee can edit -- management's broader access (via canAccessInitiative) is read/comment only. */
export async function findWritableInitiative(initiativeId: string, session: Session) {
  const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
  if (!initiative || (initiative.ownerId !== session.user.id && initiative.assignedToId !== session.user.id)) {
    return null;
  }
  return initiative;
}
