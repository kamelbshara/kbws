export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPENAI_MODEL } from "@/lib/ai/client";
import { generateLessonPlan } from "@/lib/ai/generateLessonPlan";
import { LESSON_PLAN_SECTIONS } from "@/lib/ai/lessonPlanSchema";
import { evaluateLessonPlan } from "@/lib/ai/evaluate";
import { getRelevantKnowledge } from "@/lib/knowledgeMemory";
import { getLocale } from "next-intl/server";

const bodySchema = z.object({
  section: z.enum(LESSON_PLAN_SECTIONS).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const json = await request.json().catch(() => ({}));
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const lessonPlan = await prisma.lessonPlan.findUnique({
    where: { id },
    include: {
      classSection: { include: { grade: true } },
      curriculumContent: { include: { subject: true } },
      learningOutcome: true,
    },
  });

  if (!lessonPlan || lessonPlan.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const locale = (await getLocale()) as "ar" | "en";

  const knowledgeNotes = await getRelevantKnowledge(lessonPlan.classSection.schoolId, "LESSON_PLAN", {
    subjectId: lessonPlan.curriculumContent.subjectId,
    gradeId: lessonPlan.classSection.gradeId,
  });

  const activeTemplate = await prisma.lessonPlanTemplate.findFirst({
    where: { schoolId: lessonPlan.classSection.schoolId, isActive: true },
  });
  const templateGuidance =
    activeTemplate?.structureJson && typeof activeTemplate.structureJson === "object" && "notes" in activeTemplate.structureJson
      ? String((activeTemplate.structureJson as { notes: unknown }).notes)
      : null;

  const promptInput = {
    subjectName: lessonPlan.curriculumContent.subject.name,
    gradeName: lessonPlan.classSection.grade.name,
    track: lessonPlan.classSection.track,
    unitTitle: lessonPlan.curriculumContent.unitTitle,
    lessonTitle: lessonPlan.curriculumContent.lessonTitle,
    outcomeText:
      lessonPlan.outcomeOverrideText ||
      (locale === "ar" ? lessonPlan.learningOutcome.textAr : lessonPlan.learningOutcome.textEn),
    teacherPrompt: lessonPlan.teacherPrompt,
    durationMinutes: lessonPlan.durationMinutes,
    strategies: lessonPlan.strategies,
    tools: lessonPlan.tools,
    locale,
    focusSection: parsedBody.data.section,
    knowledgeNotes,
    templateGuidance,
  };

  try {
    const result = await generateLessonPlan(promptInput);
    const evaluation = evaluateLessonPlan(result.content);

    const log = await prisma.aIGenerationLog.create({
      data: {
        lessonPlanId: lessonPlan.id,
        userId: session.user.id,
        section: parsedBody.data.section,
        model: OPENAI_MODEL,
        promptInput,
        responseJson: result.content,
        status: "SUCCESS",
        qualityScore: evaluation.score,
        qualityIssues: evaluation.issues,
      },
    });

    return NextResponse.json({ content: result.content, generationLogId: log.id, quality: evaluation });
  } catch (error) {
    await prisma.aIGenerationLog.create({
      data: {
        lessonPlanId: lessonPlan.id,
        userId: session.user.id,
        section: parsedBody.data.section,
        model: OPENAI_MODEL,
        promptInput,
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
