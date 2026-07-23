import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/dashboard/BarChart";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { CATEGORICAL, STATUS } from "@/lib/chartColors";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("dashboard");

  if (!(await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role)) {
    redirect("/");
  }

  const schoolId = await getActiveSchoolId(session!);

  const [
    lessonPlanTotal,
    lessonPlanPrinted,
    initiativeCounts,
    teamCount,
    actionItemCounts,
    schoolPlanItemCount,
  ] = schoolId
    ? await Promise.all([
        prisma.lessonPlan.count({ where: { teacher: { schoolId } } }),
        prisma.lessonPlan.count({ where: { teacher: { schoolId }, status: "PRINTED" } }),
        prisma.initiative.groupBy({ by: ["status"], where: { schoolId }, _count: { _all: true } }),
        prisma.team.count({ where: { schoolId } }),
        prisma.actionItem.groupBy({ by: ["status"], where: { meeting: { team: { schoolId } } }, _count: { _all: true } }),
        prisma.operationalPlanItem.count({ where: { operationalPlan: { level: "SCHOOL", schoolId } } }),
      ])
    : [0, 0, [], 0, [], 0];

  const initiativeByStatus = { DRAFT: 0, ACTIVE: 0, COMPLETED: 0 } as Record<string, number>;
  for (const row of initiativeCounts) initiativeByStatus[row.status] = row._count._all;

  const actionItemByStatus = { OPEN: 0, IN_PROGRESS: 0, DONE: 0 } as Record<string, number>;
  for (const row of actionItemCounts) actionItemByStatus[row.status] = row._count._all;

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <AdminNav role={user.role} />
      <main className="p-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{t("lessonPlans")}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{lessonPlanTotal}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{t("printedPlans")}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{lessonPlanPrinted}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{t("activeInitiatives")}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{initiativeByStatus.ACTIVE}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{t("teams")}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{teamCount}</CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("initiativesByStatus")}</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                title=""
                data={[
                  { label: t("draft"), value: initiativeByStatus.DRAFT, color: STATUS.neutral },
                  { label: t("active"), value: initiativeByStatus.ACTIVE, color: CATEGORICAL.blue },
                  { label: t("completed"), value: initiativeByStatus.COMPLETED, color: STATUS.good },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("actionItemsByStatus")}</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                title=""
                data={[
                  { label: t("open"), value: actionItemByStatus.OPEN, color: STATUS.neutral },
                  { label: t("inProgress"), value: actionItemByStatus.IN_PROGRESS, color: STATUS.warning },
                  { label: t("done"), value: actionItemByStatus.DONE, color: STATUS.good },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("lessonPlansByStatus")}</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                title=""
                data={[
                  { label: t("draft"), value: lessonPlanTotal - lessonPlanPrinted, color: STATUS.neutral },
                  { label: t("printed"), value: lessonPlanPrinted, color: STATUS.good },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{t("schoolDevelopmentPlan")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{schoolPlanItemCount}</p>
              <p className="text-xs text-slate-500">{t("itemsInPlan")}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
