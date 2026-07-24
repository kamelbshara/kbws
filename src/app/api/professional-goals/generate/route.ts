export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPENAI_MODEL } from "@/lib/ai/client";
import { generateProfessionalGoals } from "@/lib/ai/generateProfessionalGoals";
import { getRelevantKnowledge } from "@/lib/knowledgeMemory";
import { getActiveSchoolId } from "@/lib/activeSchool";

const bodySchema = z.object({
  prompt: z.string().min(5),
});

const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  SYSTEM_ADMIN: { en: "System Administrator", ar: "مدير النظام" },
  PRINCIPAL: { en: "Principal", ar: "مدير المدرسة" },
  VICE_PRINCIPAL: { en: "Vice Principal", ar: "نائب المدير" },
  TEACHER: { en: "Teacher", ar: "معلم" },
  INITIATIVE_OWNER: { en: "Initiative Owner", ar: "مسؤول مبادرة" },
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schoolId = await getActiveSchoolId(session);
  if (!schoolId) {
    return NextResponse.json({ error: "No active school." }, { status: 400 });
  }

  const json = await request.json().catch(() => ({}));
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Please describe what you'd like to focus on." }, { status: 400 });
  }

  const locale = (await getLocale()) as "ar" | "en";
  const roleLabel = ROLE_LABELS[session.user.role]?.[locale] ?? session.user.role;

  const knowledgeNotes = await getRelevantKnowledge(schoolId, "PROFESSIONAL_GOAL", {});

  const promptInput = {
    roleLabel,
    prompt: parsedBody.data.prompt,
    locale,
    knowledgeNotes,
  };

  try {
    const result = await generateProfessionalGoals(promptInput);

    const goal = await prisma.professionalGoal.create({
      data: {
        userId: session.user.id,
        schoolId,
        prompt: parsedBody.data.prompt,
        suggestions: result.suggestions.goals,
      },
    });

    await prisma.aIGenerationLog.create({
      data: {
        professionalGoalId: goal.id,
        userId: session.user.id,
        section: "professional_goal",
        model: OPENAI_MODEL,
        promptInput,
        responseJson: result.suggestions,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({ professionalGoalId: goal.id, suggestions: result.suggestions.goals });
  } catch (error) {
    await prisma.aIGenerationLog.create({
      data: {
        userId: session.user.id,
        section: "professional_goal",
        model: OPENAI_MODEL,
        promptInput,
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
