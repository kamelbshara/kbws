export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPENAI_MODEL } from "@/lib/ai/client";
import { generateInsights } from "@/lib/ai/generateInsights";
import { evaluateInsight } from "@/lib/ai/evaluate";
import { getRoleGroup } from "@/lib/permissions";
import { buildTeacherContext } from "@/lib/ai/teacherContext";

const bodySchema = z.object({
  scope: z.enum(["TEACHER", "SCHOOL"]),
});

async function buildSchoolContext(schoolId: string): Promise<string> {
  const [lessonPlanTotal, lessonPlanPrinted, initiativesByStatus, teamCount, actionItemsByStatus, assessmentTotal, teacherCount] =
    await Promise.all([
      prisma.lessonPlan.count({ where: { teacher: { schoolId } } }),
      prisma.lessonPlan.count({ where: { teacher: { schoolId }, status: "PRINTED" } }),
      prisma.initiative.groupBy({ by: ["status"], where: { schoolId }, _count: { _all: true } }),
      prisma.team.count({ where: { schoolId } }),
      prisma.actionItem.groupBy({ by: ["status"], where: { meeting: { team: { schoolId } } }, _count: { _all: true } }),
      prisma.assessment.count({ where: { teacher: { schoolId } } }),
      prisma.user.count({ where: { schoolId, role: "TEACHER", isActive: true } }),
    ]);

  return [
    `Active teachers: ${teacherCount}`,
    `Total lesson plans: ${lessonPlanTotal} (printed/finalized: ${lessonPlanPrinted})`,
    `Initiatives by status: ${initiativesByStatus.map((r) => `${r.status}=${r._count._all}`).join(", ") || "none"}`,
    `Teams: ${teamCount}`,
    `Action items by status: ${actionItemsByStatus.map((r) => `${r.status}=${r._count._all}`).join(", ") || "none"}`,
    `Total assessments created school-wide: ${assessmentTotal}`,
  ].join("\n");
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { scope } = parsedBody.data;

  if (scope === "TEACHER" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (scope === "SCHOOL" && !(await getRoleGroup("MANAGEMENT_ROLES")).includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.schoolId) {
    return NextResponse.json({ error: "No school associated with this account." }, { status: 400 });
  }

  const locale = (await getLocale()) as "ar" | "en";
  const contextText = scope === "TEACHER" ? await buildTeacherContext(dbUser.id) : await buildSchoolContext(dbUser.schoolId);
  const promptInput = { scope, contextText, locale };

  try {
    const result = await generateInsights(promptInput);
    const evaluation = evaluateInsight(result.content);

    const insight = await prisma.insight.create({
      data: {
        scope,
        schoolId: dbUser.schoolId,
        requestedById: dbUser.id,
        summary: result.content.summary,
        strengths: result.content.strengths,
        concerns: result.content.concerns,
        recommendations: result.content.recommendations,
      },
    });

    const log = await prisma.aIGenerationLog.create({
      data: {
        insightId: insight.id,
        userId: dbUser.id,
        model: OPENAI_MODEL,
        promptInput,
        responseJson: result.content,
        status: "SUCCESS",
        qualityScore: evaluation.score,
        qualityIssues: evaluation.issues,
      },
    });

    return NextResponse.json({
      content: result.content,
      createdAt: insight.createdAt,
      generationLogId: log.id,
      quality: evaluation,
    });
  } catch (error) {
    await prisma.aIGenerationLog.create({
      data: {
        userId: dbUser.id,
        model: OPENAI_MODEL,
        promptInput,
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
