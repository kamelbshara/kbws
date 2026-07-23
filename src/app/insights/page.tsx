import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainNav } from "@/components/layout/MainNav";
import { AdminNav } from "@/components/layout/AdminNav";
import { InsightPanel } from "@/components/insights/InsightPanel";
import { getRoleGroup } from "@/lib/permissions";
import type { InsightGeneration } from "@/lib/ai/insightSchema";

export default async function InsightsPage() {
  const session = await auth();
  const user = session!.user;

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
    <div>
      <AppHeader userName={user.name} role={user.role} />
      {isManagement ? <AdminNav role={user.role} /> : <MainNav role={user.role} />}
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-xl font-semibold">{scope === "TEACHER" ? "My Insights" : "School Insights"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {scope === "TEACHER"
            ? "AI-generated reflections on your lesson plans and assessments — grounded in your own data."
            : "AI-generated school-wide analysis across initiatives, teams, and assessments."}
        </p>

        <div className="mt-6">
          <InsightPanel
            scope={scope}
            initialContent={initialContent}
            initialGeneratedAt={insight ? insight.createdAt.toISOString() : null}
          />
        </div>
      </main>
    </div>
  );
}
