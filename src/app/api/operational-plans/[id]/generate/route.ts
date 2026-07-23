export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPENAI_MODEL } from "@/lib/ai/client";
import { generateOperationalPlan } from "@/lib/ai/generateOperationalPlan";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const plan = await prisma.operationalPlan.findUnique({ where: { id }, include: { team: true } });

  if (!plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const activeSchoolId = await getActiveSchoolId(session);
  const isAuthorized =
    plan.level === "SCHOOL"
      ? plan.schoolId === activeSchoolId && (await getRoleGroup("MANAGEMENT_ROLES")).includes(session.user.role)
      : plan.team?.leaderId === session.user.id;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const locale = (await getLocale()) as "ar" | "en";
  const promptInput = {
    title: plan.title,
    level: plan.level,
    initialIdea: plan.initialIdea,
    locale,
  };

  try {
    const result = await generateOperationalPlan(promptInput);

    await prisma.aIGenerationLog.create({
      data: {
        operationalPlanId: plan.id,
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
        operationalPlanId: plan.id,
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
