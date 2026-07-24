export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findAccessibleInitiative } from "@/lib/initiativeAccess";

function extractAnalysis(aiAnalysis: unknown): string | null {
  if (aiAnalysis && typeof aiAnalysis === "object" && "text" in aiAnalysis) {
    return String((aiAnalysis as { text: unknown }).text);
  }
  return null;
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const initiative = await findAccessibleInitiative(id, session);
  if (!initiative || !initiative.goal) {
    return NextResponse.json({ error: "Generate and save the plan before building a report." }, { status: 400 });
  }

  const [phases, indicators, evidence] = await Promise.all([
    prisma.initiativePhase.findMany({ where: { initiativeId: id }, orderBy: { orderIndex: "asc" } }),
    prisma.initiativeIndicator.findMany({ where: { initiativeId: id } }),
    prisma.initiativeEvidence.findMany({ where: { initiativeId: id }, include: { createdBy: true } }),
  ]);

  const reportJson = {
    generatedAt: new Date().toISOString(),
    title: initiative.title,
    goal: initiative.goal,
    targetGroup: initiative.targetGroup ?? "",
    phases: phases.map((p) => ({ name: p.name, description: p.description, timeline: p.timeline ?? "" })),
    indicators: indicators.map((i) => ({
      name: i.name,
      measurementMethod: i.measurementMethod,
      baselineValue: i.baselineValue ?? "",
      targetValue: i.targetValue ?? "",
      actualValue: i.actualValue ?? "",
      analysis: extractAnalysis(i.aiAnalysis),
    })),
    evidence: evidence.map((e) => ({ description: e.description, addedBy: e.createdBy.name, date: e.createdAt.toISOString().slice(0, 10) })),
    reflection: initiative.reflection ?? "",
  };

  await prisma.initiative.update({ where: { id }, data: { reportJson } });

  return NextResponse.json({ report: reportJson });
}
