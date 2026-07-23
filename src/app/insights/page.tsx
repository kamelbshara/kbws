import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InsightPanel } from "@/components/insights/InsightPanel";
import { getRoleGroup } from "@/lib/permissions";
import type { InsightGeneration } from "@/lib/ai/insightSchema";
import { AppShell } from "@/components/layout/AppShell";

export default async function InsightsPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("insights");

  const managementRoles = await getRoleGroup("MANAGEMENT_ROLES");
  const scope: "TEACHER" | "SCHOOL" | null =
    user.role === "TEACHER" ? "TEACHER" : managementRoles.includes(user.role) ? "SCHOOL" : null;

  if (!scope) {
    redirect("/");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  const insight = await prisma.insight.findFirst({
    where:
      scope === "TEACHER" ? { scope: "TEACHER", requestedById: user.id } : { scope: "SCHOOL", schoolId: dbUser?.schoolId ?? undefined },
    orderBy: { createdAt: "desc" },
  });

  const initialContent: InsightGeneration | null = insight
    ? {
        summary: insight.summary,
        strengths: insight.strengths as string[],
        concerns: insight.concerns as string[],
        recommendations: insight.recommendations as string[],
      }
    : null;

  const isManagement = managementRoles.includes(user.role);

  return (
      <AppShell userName={user.name} role={user.role} isManagement={isManagement}>
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-xl font-semibold">{scope === "TEACHER" ? t("myInsights") : t("schoolInsights")}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {scope === "TEACHER" ? t("teacherSubtitle") : t("schoolSubtitle")}
        </p>

        <div className="mt-6">
          <InsightPanel
            scope={scope}
            initialContent={initialContent}
            initialGeneratedAt={insight ? insight.createdAt.toISOString() : null}
          />
        </div>
      </main>
    </AppShell>
  );
}
