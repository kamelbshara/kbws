export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOperationalPlanPdf } from "@/lib/pdf/generateOperationalPlanPdf";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const plan = await prisma.operationalPlan.findUnique({
    where: { id },
    include: { team: true, items: { orderBy: { orderIndex: "asc" } } },
  });

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
  if (plan.items.length === 0) {
    return NextResponse.json({ error: "Generate and save the plan before printing." }, { status: 400 });
  }

  const schoolId = plan.schoolId ?? plan.team?.schoolId;
  const school = schoolId ? await prisma.school.findUnique({ where: { id: schoolId } }) : null;
  if (!school) {
    return NextResponse.json({ error: "No school associated with this plan." }, { status: 400 });
  }

  const t = await getTranslations("operationalPlan");

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateOperationalPlanPdf({
      schoolName: school.name,
      schoolNameAr: school.nameAr,
      title: plan.title,
      levelLabel: plan.level === "SCHOOL" ? t("schoolPlanSubtitle") : t("matrixTitle"),
      items: plan.items.map((item) => ({
        domain: item.domain,
        objective: item.objective,
        actions: item.actions,
        responsible: item.responsible ?? "",
        timeline: item.timeline ?? "",
        indicator: item.indicator ?? "",
        risk: item.risk ?? "",
      })),
    });
  } catch (error) {
    console.error("PDF generation failed", error);
    return NextResponse.json({ error: "Failed to generate PDF." }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="operational-plan-${plan.id}.pdf"`,
    },
  });
}
