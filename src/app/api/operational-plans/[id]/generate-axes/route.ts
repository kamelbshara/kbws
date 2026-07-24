export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOperationalPlanAxes } from "@/lib/ai/generateOperationalPlan";
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

  try {
    const result = await generateOperationalPlanAxes({
      title: plan.title,
      level: plan.level,
      initialIdea: plan.initialIdea,
      locale,
    });

    return NextResponse.json({ axes: result.axes.axes });
  } catch {
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
