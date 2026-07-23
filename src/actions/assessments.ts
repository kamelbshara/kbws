"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRole, TEACHER_ROLES, ForbiddenError } from "@/lib/permissions";
import { AssessmentSaveSchema } from "@/lib/ai/questionSchema";
import type { QuestionType, QuestionDifficulty } from "@/generated/prisma/enums";

export type ActionState = { error?: string } | undefined;

const createAssessmentSchema = z.object({
  lessonPlanId: z.string().min(1),
  title: z.string().min(3),
});

export async function createAssessmentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  requireRole(session, TEACHER_ROLES);
  const teacherId = session!.user.id;

  const parsed = createAssessmentSchema.safeParse({
    lessonPlanId: formData.get("lessonPlanId"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const lessonPlan = await prisma.lessonPlan.findUnique({ where: { id: parsed.data.lessonPlanId } });
  if (!lessonPlan || lessonPlan.teacherId !== teacherId) {
    throw new ForbiddenError("This lesson plan does not belong to you.");
  }

  const assessment = await prisma.assessment.create({
    data: {
      teacherId,
      lessonPlanId: lessonPlan.id,
      title: parsed.data.title,
    },
  });

  await logAudit({
    userId: teacherId,
    action: "CREATE",
    module: "Assessments",
    entityId: assessment.id,
    after: { title: assessment.title, lessonPlanId: lessonPlan.id },
  });

  redirect(`/assessments/${assessment.id}`);
}

export async function saveAssessmentQuestionsAction(
  assessmentId: string,
  content: unknown,
): Promise<{ error?: string }> {
  const session = await auth();
  requireRole(session, TEACHER_ROLES);
  const teacherId = session!.user.id;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      lessonPlan: { include: { curriculumContent: true, classSection: true } },
    },
  });
  if (!assessment || assessment.teacherId !== teacherId) {
    throw new ForbiddenError("This assessment does not belong to you.");
  }
  if (!assessment.lessonPlan) {
    return { error: "This assessment has no linked lesson." };
  }

  const result = AssessmentSaveSchema.safeParse(content);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid question data." };
  }
  const parsed = result.data;

  const subjectId = assessment.lessonPlan.curriculumContent.subjectId;
  const gradeId = assessment.lessonPlan.classSection.gradeId;

  await prisma.$transaction(async (tx) => {
    await tx.assessmentQuestion.deleteMany({ where: { assessmentId } });

    for (let i = 0; i < parsed.questions.length; i++) {
      const q = parsed.questions[i];
      const question = await tx.questionBankItem.create({
        data: {
          subjectId,
          gradeId,
          skill: q.skill,
          difficulty: q.difficulty as QuestionDifficulty,
          type: q.type as QuestionType,
          questionText: q.questionText,
          choices: q.choices ?? undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          createdById: teacherId,
        },
      });
      await tx.assessmentQuestion.create({
        data: { assessmentId, questionId: question.id, orderIndex: i },
      });
    }
  });

  await logAudit({
    userId: teacherId,
    action: "UPDATE",
    module: "Assessments",
    entityId: assessmentId,
    after: { questionCount: parsed.questions.length },
  });

  revalidatePath(`/assessments/${assessmentId}`);
  return {};
}
