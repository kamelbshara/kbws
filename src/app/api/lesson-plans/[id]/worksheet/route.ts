export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPENAI_MODEL } from "@/lib/ai/client";
import { generateWorksheet } from "@/lib/ai/generateWorksheet";
import { LessonPlanContentSchema } from "@/lib/ai/lessonPlanSchema";
import { getRelevantKnowledge } from "@/lib/knowledgeMemory";
import { logAudit } from "@/lib/audit";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

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

  const contentParse = LessonPlanContentSchema.safeParse(lessonPlan.contentJson);
  if (!contentParse.success) {
    return NextResponse.json({ error: "Generate and save the lesson plan before creating a worksheet." }, { status: 400 });
  }

  const locale = (await getLocale()) as "ar" | "en";
  const outcomeText =
    lessonPlan.outcomeOverrideText ||
    (locale === "ar" ? lessonPlan.learningOutcome.textAr : lessonPlan.learningOutcome.textEn);

  const knowledgeNotes = await getRelevantKnowledge(lessonPlan.classSection.schoolId, "LESSON_PLAN", {
    subjectId: lessonPlan.curriculumContent.subjectId,
    gradeId: lessonPlan.classSection.gradeId,
  });

  const promptInput = {
    subjectName: lessonPlan.curriculumContent.subject.name,
    gradeName: lessonPlan.classSection.grade.name,
    unitTitle: lessonPlan.curriculumContent.unitTitle,
    lessonTitle: lessonPlan.curriculumContent.lessonTitle,
    outcomeText,
    lessonPlanContent: contentParse.data,
    locale,
    knowledgeNotes,
  };

  try {
    const result = await generateWorksheet(promptInput);

    const worksheet = await prisma.worksheet.create({
      data: {
        lessonPlanId: lessonPlan.id,
        contentJson: result.content,
        createdById: session.user.id,
      },
    });

    await prisma.aIGenerationLog.create({
      data: {
        worksheetId: worksheet.id,
        userId: session.user.id,
        section: "worksheet",
        model: OPENAI_MODEL,
        promptInput,
        responseJson: result.content,
        status: "SUCCESS",
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      module: "Worksheets",
      entityId: worksheet.id,
      after: { lessonPlanId: lessonPlan.id },
    });

    return NextResponse.json({ worksheetId: worksheet.id, content: result.content });
  } catch (error) {
    await prisma.aIGenerationLog.create({
      data: {
        userId: session.user.id,
        section: "worksheet",
        model: OPENAI_MODEL,
        promptInput,
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
