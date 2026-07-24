export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPENAI_MODEL } from "@/lib/ai/client";
import { generateIndicatorAnalysis } from "@/lib/ai/generateInitiativeAnalysis";
import { findWritableInitiative } from "@/lib/initiativeAccess";
import { getRelevantKnowledge } from "@/lib/knowledgeMemory";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const initiative = await findWritableInitiative(id, session);
  if (!initiative) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const indicators = await prisma.initiativeIndicator.findMany({ where: { initiativeId: id } });
  const withResults = indicators.filter((i) => i.actualValue && i.actualValue.trim().length > 0);
  if (withResults.length === 0) {
    return NextResponse.json({ error: "No indicators have results recorded yet." }, { status: 400 });
  }

  const locale = (await getLocale()) as "ar" | "en";
  const knowledgeNotes = await getRelevantKnowledge(initiative.schoolId, "INITIATIVE", {});
  const promptInput = {
    goal: initiative.goal ?? "",
    indicators: withResults.map((i) => ({
      name: i.name,
      measurementMethod: i.measurementMethod,
      baselineValue: i.baselineValue ?? "",
      targetValue: i.targetValue ?? "",
      actualValue: i.actualValue ?? "",
    })),
    locale,
    knowledgeNotes,
  };

  try {
    const result = await generateIndicatorAnalysis(promptInput);

    await Promise.all(
      result.content.analyses.map((a) => {
        const match = withResults.find((i) => i.name === a.indicatorName);
        if (!match) return Promise.resolve();
        return prisma.initiativeIndicator.update({
          where: { id: match.id },
          data: { aiAnalysis: { text: a.analysis } },
        });
      }),
    );

    await prisma.aIGenerationLog.create({
      data: {
        initiativeId: id,
        userId: session.user.id,
        section: "indicator_analysis",
        model: OPENAI_MODEL,
        promptInput,
        responseJson: result.content,
        status: "SUCCESS",
      },
    });

    const updated = await prisma.initiativeIndicator.findMany({ where: { initiativeId: id } });
    return NextResponse.json({
      indicators: updated.map((i) => ({
        id: i.id,
        name: i.name,
        analysis: i.aiAnalysis && typeof i.aiAnalysis === "object" && "text" in i.aiAnalysis ? String((i.aiAnalysis as { text: unknown }).text) : null,
      })),
    });
  } catch (error) {
    await prisma.aIGenerationLog.create({
      data: {
        initiativeId: id,
        userId: session.user.id,
        section: "indicator_analysis",
        model: OPENAI_MODEL,
        promptInput,
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 502 });
  }
}
