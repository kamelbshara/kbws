"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRoleGroup, ForbiddenError } from "@/lib/permissions";
import { InitiativeSaveSchema } from "@/lib/ai/initiativeSchema";
import type { InitiativeCategory } from "@/generated/prisma/enums";

export type ActionState = { error?: string } | undefined;

const createInitiativeSchema = z.object({
  title: z.string().min(3),
  category: z.enum(["EDUCATIONAL", "COMMUNITY", "NATIONAL", "INNOVATION", "HEALTH_SAFETY", "OTHER"]),
  initialIdea: z.string().min(10),
});

export async function createInitiativeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  await requireRoleGroup(session, "INITIATIVE_CREATOR_ROLES");
  const ownerId = session!.user.id;

  const parsed = createInitiativeSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    initialIdea: formData.get("initialIdea"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const school = await prisma.school.findFirstOrThrow();

  const initiative = await prisma.initiative.create({
    data: {
      ownerId,
      schoolId: school.id,
      title: parsed.data.title,
      category: parsed.data.category as InitiativeCategory,
      initialIdea: parsed.data.initialIdea,
      status: "DRAFT",
    },
  });

  await logAudit({
    userId: ownerId,
    action: "CREATE",
    module: "Initiatives",
    entityId: initiative.id,
    after: { title: initiative.title, category: initiative.category },
  });

  redirect(`/initiatives/${initiative.id}`);
}

async function requireOwnedInitiative(initiativeId: string, userId: string) {
  const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
  if (!initiative || initiative.ownerId !== userId) {
    throw new ForbiddenError("This initiative does not belong to you.");
  }
  return initiative;
}

export async function saveInitiativePlanAction(initiativeId: string, content: unknown): Promise<{ error?: string }> {
  const session = await auth();
  await requireRoleGroup(session, "INITIATIVE_CREATOR_ROLES");
  const initiative = await requireOwnedInitiative(initiativeId, session!.user.id);

  const result = InitiativeSaveSchema.safeParse(content);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid plan data." };
  }
  const parsed = result.data;

  await prisma.$transaction([
    prisma.initiative.update({
      where: { id: initiativeId },
      data: { goal: parsed.goal, targetGroup: parsed.targetGroup },
    }),
    prisma.initiativePhase.deleteMany({ where: { initiativeId } }),
    prisma.initiativeIndicator.deleteMany({ where: { initiativeId } }),
    prisma.initiativePhase.createMany({
      data: parsed.phases.map((phase, index) => ({
        initiativeId,
        orderIndex: index,
        name: phase.name,
        description: phase.description,
        timeline: phase.timeline,
      })),
    }),
    prisma.initiativeIndicator.createMany({
      data: parsed.indicators.map((indicator) => ({
        initiativeId,
        name: indicator.name,
        measurementMethod: indicator.measurementMethod,
        targetValue: indicator.targetValue,
      })),
    }),
  ]);

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE",
    module: "Initiatives",
    entityId: initiativeId,
    before: { goal: initiative.goal, targetGroup: initiative.targetGroup },
    after: { goal: parsed.goal, targetGroup: parsed.targetGroup, phases: parsed.phases, indicators: parsed.indicators },
  });

  revalidatePath(`/initiatives/${initiativeId}`);
  return {};
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
  await requireOwnedInitiative(initiativeId, session!.user.id);

  const parsed = addEvidenceSchema.safeParse({
    description: formData.get("description"),
    link: formData.get("link") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const evidence = await prisma.initiativeEvidence.create({
    data: {
      initiativeId,
      description: parsed.data.description,
      link: parsed.data.link || undefined,
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
  const initiative = await requireOwnedInitiative(initiativeId, session!.user.id);

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

  revalidatePath(`/initiatives/${initiativeId}`);
}
