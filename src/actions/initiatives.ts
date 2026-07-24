"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRoleGroup, getRoleGroup, ForbiddenError } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { createNotifications } from "@/lib/notifications";
import { InitiativeSaveSchema } from "@/lib/ai/initiativeSchema";
import { saveUploadedFile, isAllowedUploadType, MAX_UPLOAD_BYTES } from "@/lib/storage";
import type { InitiativeCategory } from "@/generated/prisma/enums";

export type ActionState = { error?: string } | undefined;

const createInitiativeSchema = z.object({
  title: z.string().min(3),
  category: z.enum(["EDUCATIONAL", "COMMUNITY", "NATIONAL", "INNOVATION", "HEALTH_SAFETY", "OTHER"]),
  initialIdea: z.string().min(10),
  assignedToId: z.string().optional(),
});

export async function createInitiativeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  await requireRoleGroup(session, "INITIATIVE_CREATOR_ROLES");
  const ownerId = session!.user.id;

  const parsed = createInitiativeSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    initialIdea: formData.get("initialIdea"),
    assignedToId: formData.get("assignedToId") === "NONE" ? undefined : formData.get("assignedToId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const schoolId = await getActiveSchoolId(session!);
  if (!schoolId) {
    return { error: "No school is associated with this account." };
  }

  // Only management can assign an initiative to someone else -- a teacher's
  // own submission always creates the initiative under themselves.
  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(session!.user.role);
  let assignedToId: string | undefined;
  if (isManagement && parsed.data.assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: parsed.data.assignedToId } });
    if (assignee && assignee.schoolId === schoolId) {
      assignedToId = assignee.id;
    }
  }

  const initiative = await prisma.initiative.create({
    data: {
      ownerId,
      assignedToId,
      schoolId,
      title: parsed.data.title,
      category: parsed.data.category as InitiativeCategory,
      initialIdea: parsed.data.initialIdea,
      status: "DRAFT",
    },
  });

  if (assignedToId && assignedToId !== ownerId) {
    await createNotifications([assignedToId], {
      type: "INITIATIVE_ASSIGNED",
      title: `You've been assigned an initiative: "${initiative.title}"`,
      link: `/initiatives/${initiative.id}`,
    });
  }

  await logAudit({
    userId: ownerId,
    action: "CREATE",
    module: "Initiatives",
    entityId: initiative.id,
    after: { title: initiative.title, category: initiative.category, assignedToId },
  });

  redirect(`/initiatives/${initiative.id}`);
}

/** Owner, assignee, or management (same school) can view/comment -- read-only oversight is intentionally broader than edit. */
async function requireInitiativeReadAccess(initiativeId: string, session: Session) {
  const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
  if (!initiative) {
    throw new ForbiddenError("Initiative not found.");
  }
  const isOwnerOrAssignee = initiative.ownerId === session.user.id || initiative.assignedToId === session.user.id;
  if (isOwnerOrAssignee) {
    return initiative;
  }
  const schoolId = await getActiveSchoolId(session);
  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(session.user.role);
  if (isManagement && initiative.schoolId === schoolId) {
    return initiative;
  }
  throw new ForbiddenError("This initiative does not belong to you.");
}

/** Only the owner or the assignee can edit an initiative's content -- management's broader access is read/comment only. */
async function requireInitiativeWriteAccess(initiativeId: string, session: Session) {
  const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
  if (!initiative || (initiative.ownerId !== session.user.id && initiative.assignedToId !== session.user.id)) {
    throw new ForbiddenError("This initiative does not belong to you.");
  }
  return initiative;
}

export type SaveResult = { error?: string; conflict?: boolean; updatedAt?: string };

export async function saveInitiativePlanAction(
  initiativeId: string,
  content: unknown,
  expectedUpdatedAt: string,
): Promise<SaveResult> {
  const session = await auth();
  await requireRoleGroup(session, "INITIATIVE_CREATOR_ROLES");
  const initiative = await requireInitiativeWriteAccess(initiativeId, session!);

  if (initiative.updatedAt.toISOString() !== expectedUpdatedAt) {
    return {
      conflict: true,
      error: "This initiative was changed elsewhere since you opened it. Reload the page to see the latest version before saving.",
    };
  }

  const result = InitiativeSaveSchema.safeParse(content);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid plan data." };
  }
  const parsed = result.data;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.initiative.update({
      where: { id: initiativeId },
      data: { goal: parsed.goal, targetGroup: parsed.targetGroup },
    });
    await tx.initiativeIndicator.deleteMany({ where: { initiativeId } });
    await tx.initiativePhase.deleteMany({ where: { initiativeId } });

    const createdPhases = [];
    for (const [index, phase] of parsed.phases.entries()) {
      createdPhases.push(
        await tx.initiativePhase.create({
          data: { initiativeId, orderIndex: index, name: phase.name, description: phase.description, timeline: phase.timeline },
        }),
      );
    }

    for (const indicator of parsed.indicators) {
      const phaseId =
        indicator.phaseIndex !== undefined ? createdPhases[indicator.phaseIndex]?.id : undefined;
      await tx.initiativeIndicator.create({
        data: {
          initiativeId,
          phaseId,
          name: indicator.name,
          measurementMethod: indicator.measurementMethod,
          baselineValue: indicator.baselineValue,
          targetValue: indicator.targetValue,
          actualValue: indicator.actualValue,
          aiAnalysis: indicator.aiAnalysis ? { text: indicator.aiAnalysis } : undefined,
        },
      });
    }

    return result;
  });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE",
    module: "Initiatives",
    entityId: initiativeId,
    before: { goal: initiative.goal, targetGroup: initiative.targetGroup },
    after: { goal: parsed.goal, targetGroup: parsed.targetGroup, phases: parsed.phases, indicators: parsed.indicators },
  });

  revalidatePath(`/initiatives/${initiativeId}`);
  return { updatedAt: updated.updatedAt.toISOString() };
}

const addEvidenceSchema = z.object({
  description: z.string().min(3),
  link: z.string().url().optional().or(z.literal("")),
});

export async function addInitiativeEvidenceAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  await requireRoleGroup(session, "INITIATIVE_CREATOR_ROLES");

  const initiativeId = formData.get("initiativeId");
  if (typeof initiativeId !== "string") {
    return { error: "Missing initiative id" };
  }
  await requireInitiativeWriteAccess(initiativeId, session!);

  const parsed = addEvidenceSchema.safeParse({
    description: formData.get("description"),
    link: formData.get("link") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let stored: { url: string; fileName: string; fileSize: number; mimeType: string } | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: "File is too large (max 10MB)." };
    }
    if (!isAllowedUploadType(file.type)) {
      return { error: "Unsupported file type. Allowed: images, PDF, and Word documents." };
    }
    stored = await saveUploadedFile(file, "initiative-evidence");
  }

  const evidence = await prisma.initiativeEvidence.create({
    data: {
      initiativeId,
      description: parsed.data.description,
      link: parsed.data.link || undefined,
      fileUrl: stored?.url,
      fileName: stored?.fileName,
      fileSize: stored?.fileSize,
      mimeType: stored?.mimeType,
      createdById: session!.user.id,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CREATE",
    module: "InitiativeEvidence",
    entityId: evidence.id,
    after: { initiativeId, description: parsed.data.description },
  });

  revalidatePath(`/initiatives/${initiativeId}`);
  return { error: undefined };
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: [],
};

export async function updateInitiativeStatusAction(initiativeId: string, nextStatus: "ACTIVE" | "COMPLETED") {
  const session = await auth();
  await requireRoleGroup(session, "INITIATIVE_CREATOR_ROLES");
  const initiative = await requireInitiativeWriteAccess(initiativeId, session!);

  if (!STATUS_TRANSITIONS[initiative.status]?.includes(nextStatus)) {
    throw new Error(`Cannot transition from ${initiative.status} to ${nextStatus}`);
  }

  await prisma.initiative.update({ where: { id: initiativeId }, data: { status: nextStatus } });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE",
    module: "Initiatives",
    entityId: initiativeId,
    before: { status: initiative.status },
    after: { status: nextStatus },
  });

  const managementRoles = await getRoleGroup("MANAGEMENT_ROLES");
  const managers = await prisma.user.findMany({
    where: { schoolId: initiative.schoolId, role: { in: managementRoles }, isActive: true },
  });
  await createNotifications(
    managers.map((m) => m.id).filter((id) => id !== session!.user.id),
    {
      type: "INITIATIVE_STATUS_CHANGE",
      title: `Initiative "${initiative.title}" is now ${nextStatus}`,
      link: `/initiatives/${initiativeId}`,
    },
  );

  revalidatePath(`/initiatives/${initiativeId}`);
}

const addCommentSchema = z.object({
  body: z.string().min(1),
});

export type CommentActionState = { error?: string } | undefined;

export async function addInitiativeCommentAction(
  _prevState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const session = await auth();
  if (!session?.user) {
    throw new ForbiddenError("Unauthorized");
  }

  const initiativeId = formData.get("initiativeId");
  if (typeof initiativeId !== "string") {
    return { error: "Missing initiative id" };
  }
  const initiative = await requireInitiativeReadAccess(initiativeId, session);

  const parsed = addCommentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  const comment = await prisma.initiativeComment.create({
    data: { initiativeId, authorId: session.user.id, body: parsed.data.body },
  });

  const notifyIds = [initiative.ownerId, initiative.assignedToId].filter(
    (uid): uid is string => Boolean(uid) && uid !== session.user.id,
  );
  await createNotifications(notifyIds, {
    type: "INITIATIVE_COMMENT",
    title: `New comment on "${initiative.title}"`,
    link: `/initiatives/${initiativeId}`,
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    module: "InitiativeComments",
    entityId: comment.id,
    after: { initiativeId, body: parsed.data.body },
  });

  revalidatePath(`/initiatives/${initiativeId}`);
  return undefined;
}
