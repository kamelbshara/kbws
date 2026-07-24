import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { ProfessionalGoalForm } from "@/components/professional-goals/ProfessionalGoalForm";
import { getRoleGroup } from "@/lib/permissions";

export default async function ProfessionalGoalsPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("professionalGoalsPage");
  const managementRoles = await getRoleGroup("MANAGEMENT_ROLES");
  const isManagement = managementRoles.includes(user.role);

  const pastGoals = await prisma.professionalGoal.findMany({
    where: { userId: user.id, selectedGoal: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell userName={user.name} role={user.role} isManagement={isManagement}>
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>

        <div className="mt-6">
          <ProfessionalGoalForm />
        </div>

        {pastGoals.length > 0 && (
          <div className="mt-8 rounded-md border border-slate-200 p-4">
            <h2 className="font-medium">{t("pastGoalsTitle")}</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {pastGoals.map((g) => (
                <li key={g.id} className="rounded-md bg-slate-50 p-2">
                  {g.selectedGoal}
                  <span className="ms-2 text-xs text-slate-400">{g.createdAt.toISOString().slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </AppShell>
  );
}
