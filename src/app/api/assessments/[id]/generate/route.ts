export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPENAI_MODEL } from "@/lib/ai/client";
import { generateAssessmentQuestions } from "@/lib/ai/generateQuestions";

const bodySchema = z.object({
  questionCount: z.coerce.number().int().min(3).max(20).default(10),
  mcqRatio: z.coerce.number().min(0).max(1).default(0.8),
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

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      lessonPlan: {
        include: {
          curriculumContent: { include: { subject: true } },
          classSection: { include: { grade: true } },
          learningOutcome: true,
        },
      },
    },
  });

  if (!assessment || assessment.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!assessment.lessonPlan) {
    return NextResponse.json({ error: "This assessment has no linked lesson to generate from." }, { status: 400 });
  }

  const locale = (await getLocale()) as "ar" | "en";
  const lp = assessment.lessonPlan;
  const promptInput = {
    subjectName: lp.curriculumContent.subject.name,
    gradeName: lp.classSection.grade.name,
    outcomeText: lp.outcomeOverrideText || (locale === "ar" ? lp.learningOutcome.textAr : lp.learningOutcome.textEn),
    teacherPrompt: lp.teacherPrompt,
    questionCount: parsedBody.data.questionCount,
    mcqRatio: parsedBody.data.mcqRatio,
    locale,
  };

  try {
    const result = await generateAssessmentQuestions(promptInput);

    await prisma.aIGenerationLog.create({
      data: {
        assessmentId: assessment.id,
        userId: session.user.id,
        model: OPENAI_MODEL,
        promptInput,
        responseJson: result.content,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({ content: result.content });
  } catch (error) {
    await prisma.aIGenerationLog.create({
      data: {
        assessmentId: assessment.id,
        userId: session.user.id,
        model: OPENAI_MODEL,
        promptInput,
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
