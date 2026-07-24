export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPENAI_MODEL } from "@/lib/ai/client";
import { generateInitiativeReflection } from "@/lib/ai/generateInitiativeAnalysis";
import { findWritableInitiative } from "@/lib/initiativeAccess";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const initiative = await findWritableInitiative(id, session);
  if (!initiative || !initiative.goal) {
    return NextResponse.json({ error: "Generate and save the plan before requesting a reflection." }, { status: 400 });
  }

  const [phases, indicators, evidence] = await Promise.all([
    prisma.initiativePhase.findMany({ where: { initiativeId: id }, orderBy: { orderIndex: "asc" } }),
    prisma.initiativeIndicator.findMany({ where: { initiativeId: id } }),
    prisma.initiativeEvidence.findMany({ where: { initiativeId: id } }),
  ]);

  const locale = (await getLocale()) as "ar" | "en";
  const promptInput = {
    title: initiative.title,
    goal: initiative.goal,
    phases: phases.map((p) => ({ name: p.name, description: p.description })),
    indicators: indicators.map((i) => ({ name: i.name, targetValue: i.targetValue ?? "", actualValue: i.actualValue ?? "" })),
    evidenceDescriptions: evidence.map((e) => e.description),
    locale,
  };

  try {
    const result = await generateInitiativeReflection(promptInput);

    await prisma.initiative.update({ where: { id }, data: { reflection: result.content.reflection } });

    await prisma.aIGenerationLog.create({
      data: {
        initiativeId: id,
        userId: session.user.id,
        section: "reflection",
        model: OPENAI_MODEL,
        promptInput,
        responseJson: result.content,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({ reflection: result.content.reflection });
  } catch (error) {
    await prisma.aIGenerationLog.create({
      data: {
        initiativeId: id,
        userId: session.user.id,
        section: "reflection",
        model: OPENAI_MODEL,
        promptInput,
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
