import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OperationalPlanEditor } from "@/components/team/OperationalPlanEditor";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import type { OperationalPlanGeneration } from "@/lib/ai/operationalPlanSchema";
import { AppShell } from "@/components/layout/AppShell";

export default async function SchoolOperationalPlanPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("operationalPlan");

  if (!(await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role)) {
    redirect("/");
  }

  const schoolId = await getActiveSchoolId(session!);
  if (!schoolId) {
    redirect("/admin/schools");
  }
  const school = await prisma.school.findUniqueOrThrow({ where: { id: schoolId } });
  const activeYear = await prisma.academicYear.findFirst({ where: { schoolId: school.id, isActive: true } });

  let plan = await prisma.operationalPlan.findFirst({
    where: { level: "SCHOOL", schoolId: school.id, academicYearId: activeYear?.id ?? null },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });

  if (!plan) {
    const previousPlan = await prisma.operationalPlan.findFirst({
      where: { level: "SCHOOL", schoolId: school.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const carryForwardNote =
      previousPlan && previousPlan.items.length > 0
        ? ` Institutional memory: last year's plan covered these domains -- ${previousPlan.items.map((i) => i.domain).join(", ")}. Build on this progress rather than repeating it.`
        : "";

    plan = await prisma.operationalPlan.create({
      data: {
        level: "SCHOOL",
        schoolId: school.id,
        academicYearId: activeYear?.id,
        previousPlanId: previousPlan?.id,
        title: `${school.name} Development Plan${activeYear ? ` — ${activeYear.name}` : ""}`,
        initialIdea: `School-wide development plan covering all improvement priorities for the academic year.${carryForwardNote}`,
      },
      include: { items: true },
    });
  }

  const planContent: OperationalPlanGeneration | null =
    plan.items.length > 0
      ? {
          items: plan.items.map((i) => ({
            domain: i.domain,
            objective: i.objective,
            actions: i.actions,
            responsible: i.responsible ?? "",
            timeline: i.timeline ?? "",
            indicator: i.indicator ?? "",
            risk: i.risk ?? "",
          })),
        }
      : null;

  return (
      <AppShell userName={user.name} role={user.role} isManagement>
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-xl font-semibold">{plan.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("schoolPlanSubtitle")}</p>
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("planMatrixTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <OperationalPlanEditor planId={plan.id} initialContent={planContent} updatedAt={plan.updatedAt.toISOString()} />
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
