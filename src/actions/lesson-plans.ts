"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRoleGroup, ForbiddenError } from "@/lib/permissions";

export type ActionState = { error?: string } | undefined;

const createLessonPlanSchema = z.object({
  timetableId: z.string().min(1),
  learningOutcomeId: z.string().min(1),
  outcomeOverrideText: z.string().optional(),
  outcomeOverrideReason: z.string().optional(),
  lessonDate: z.string().min(1),
  durationMinutes: z.coerce.number().int().min(10).max(180),
  teacherPrompt: z.string().min(5),
  strategies: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
});

export async function createLessonPlanAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  await requireRoleGroup(session, "TEACHER_ROLES");
  const teacherId = session!.user.id;

  const parsed = createLessonPlanSchema.safeParse({
    timetableId: formData.get("timetableId"),
    learningOutcomeId: formData.get("learningOutcomeId"),
    outcomeOverrideText: formData.get("outcomeOverrideText") || undefined,
    outcomeOverrideReason: formData.get("outcomeOverrideReason") || undefined,
    lessonDate: formData.get("lessonDate"),
    durationMinutes: formData.get("durationMinutes"),
    teacherPrompt: formData.get("teacherPrompt"),
    strategies: formData.getAll("strategies"),
    tools: formData.getAll("tools"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const timetable = await prisma.timetable.findUnique({ where: { id: parsed.data.timetableId } });
  if (!timetable || timetable.teacherId !== teacherId) {
    throw new ForbiddenError("This schedule slot does not belong to you.");
  }

  const learningOutcome = await prisma.learningOutcome.findUnique({
    where: { id: parsed.data.learningOutcomeId },
  });
  if (!learningOutcome) {
    return { error: "Learning outcome not found." };
  }

  const lessonPlan = await prisma.lessonPlan.create({
    data: {
      teacherId,
      timetableId: timetable.id,
      classSectionId: timetable.classSectionId,
      curriculumContentId: learningOutcome.curriculumContentId,
      learningOutcomeId: learningOutcome.id,
      outcomeOverrideText: parsed.data.outcomeOverrideText,
      outcomeOverrideReason: parsed.data.outcomeOverrideReason,
      lessonDate: new Date(parsed.data.lessonDate),
      durationMinutes: parsed.data.durationMinutes,
      teacherPrompt: parsed.data.teacherPrompt,
      strategies: parsed.data.strategies,
      tools: parsed.data.tools,
      status: "DRAFT",
    },
  });

  await logAudit({
    userId: teacherId,
    action: "CREATE",
    module: "LessonPlanning",
    entityId: lessonPlan.id,
    after: { timetableId: timetable.id, learningOutcomeId: learningOutcome.id },
  });

  redirect(`/lesson-plans/${lessonPlan.id}`);
}

export async function saveLessonPlanContentAction(lessonPlanId: string, content: unknown) {
  const session = await auth();
  await requireRoleGroup(session, "TEACHER_ROLES");

  const existing = await prisma.lessonPlan.findUnique({ where: { id: lessonPlanId } });
  if (!existing || existing.teacherId !== session!.user.id) {
    throw new ForbiddenError("This lesson plan does not belong to you.");
  }

  await prisma.lessonPlan.update({
    where: { id: lessonPlanId },
    data: { contentJson: content as object },
  });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE",
    module: "LessonPlanning",
    entityId: lessonPlanId,
    before: { contentJson: existing.contentJson },
    after: { contentJson: content },
  });
}
