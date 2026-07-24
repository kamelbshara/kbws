export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInitiativePdf } from "@/lib/pdf/generateInitiativePdf";
import { canAccessInitiative } from "@/lib/initiativeAccess";

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
  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      owner: true,
      school: true,
      phases: { orderBy: { orderIndex: "asc" } },
      indicators: true,
      evidence: { include: { createdBy: true } },
    },
  });

  if (!initiative || !(await canAccessInitiative(initiative, session))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!initiative.goal) {
    return NextResponse.json({ error: "Generate and save the plan before printing." }, { status: 400 });
  }

  const t = await getTranslations("initiatives");

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateInitiativePdf({
      schoolName: initiative.school.name,
      schoolNameAr: initiative.school.nameAr,
      title: initiative.title,
      categoryLabel: t(`categories.${initiative.category}`),
      statusLabel: t(`statuses.${initiative.status}`),
      ownerName: initiative.owner.name,
      initialIdea: initiative.initialIdea,
      goal: initiative.goal,
      targetGroup: initiative.targetGroup ?? "",
      phases: initiative.phases.map((p) => ({ name: p.name, description: p.description, timeline: p.timeline ?? "" })),
      indicators: initiative.indicators.map((i) => ({
        name: i.name,
        measurementMethod: i.measurementMethod,
        baselineValue: i.baselineValue ?? "",
        targetValue: i.targetValue ?? "",
        actualValue: i.actualValue ?? "",
        analysis: extractAnalysis(i.aiAnalysis),
      })),
      evidence: initiative.evidence.map((e) => ({
        description: e.description,
        addedBy: e.createdBy.name,
        date: e.createdAt.toISOString().slice(0, 10),
      })),
      reflection: initiative.reflection,
      reportDate: new Date().toISOString().slice(0, 10),
    });
  } catch (error) {
    console.error("PDF generation failed", error);
    return NextResponse.json({ error: "Failed to generate PDF." }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="initiative-${initiative.id}.pdf"`,
    },
  });
}
