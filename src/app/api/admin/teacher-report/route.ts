export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPENAI_MODEL } from "@/lib/ai/client";
import { generateInsights } from "@/lib/ai/generateInsights";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { buildTeacherContext } from "@/lib/ai/teacherContext";
import { getRelevantKnowledge } from "@/lib/knowledgeMemory";

const bodySchema = z.object({
  teacherId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await getRoleGroup("MANAGEMENT_ROLES")).includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolId = await getActiveSchoolId(session);
  if (!schoolId) {
    return NextResponse.json({ error: "No active school." }, { status: 400 });
  }

  const json = await request.json().catch(() => ({}));
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const teacher = await prisma.user.findUnique({ where: { id: parsedBody.data.teacherId } });
  if (!teacher || teacher.schoolId !== schoolId || teacher.role !== "TEACHER") {
    return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
  }

  const locale = (await getLocale()) as "ar" | "en";
  const contextText = await buildTeacherContext(teacher.id);
  const knowledgeNotes = await getRelevantKnowledge(schoolId, "INSIGHT", {});
  const promptInput = { scope: "TEACHER" as const, contextText, locale, knowledgeNotes };

  try {
    const result = await generateInsights(promptInput);

    await prisma.aIGenerationLog.create({
      data: {
        userId: session.user.id,
        section: "teacher_report",
        model: OPENAI_MODEL,
        promptInput: { ...promptInput, teacherId: teacher.id },
        responseJson: result.content,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({ teacherName: teacher.name, content: result.content });
  } catch (error) {
    await prisma.aIGenerationLog.create({
      data: {
        userId: session.user.id,
        section: "teacher_report",
        model: OPENAI_MODEL,
        promptInput: { ...promptInput, teacherId: teacher.id },
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
