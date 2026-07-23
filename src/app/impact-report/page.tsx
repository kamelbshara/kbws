import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { AppShell } from "@/components/layout/AppShell";

export default async function ImpactReportPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("impactReport");
  const tInit = await getTranslations("initiatives");

  if (!(await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role)) {
    redirect("/");
  }

  const schoolId = await getActiveSchoolId(session!);
  const initiatives = schoolId
    ? await prisma.initiative.findMany({
        where: { schoolId, indicators: { some: {} } },
        include: { indicators: true, owner: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
      <AppShell userName={user.name} role={user.role} isManagement>
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>

        <div className="mt-6 flex flex-col gap-6">
          {initiatives.map((initiative) => (
            <div key={initiative.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="font-medium">{initiative.title}</h2>
              <p className="text-xs text-slate-500">
                {tInit(`statuses.${initiative.status}`)} · {initiative.owner.name}
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 text-left text-slate-500">
                    <tr>
                      <th className="px-2 py-1 font-medium">{t("indicator")}</th>
                      <th className="px-2 py-1 font-medium">{t("baseline")}</th>
                      <th className="px-2 py-1 font-medium">{t("current")}</th>
                      <th className="px-2 py-1 font-medium">{t("target")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initiative.indicators.map((indicator) => (
                      <tr key={indicator.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-2 py-1 font-medium">{indicator.name}</td>
                        <td className="px-2 py-1 text-slate-600">{indicator.baselineValue || "—"}</td>
                        <td className="px-2 py-1 text-slate-600">{indicator.actualValue || "—"}</td>
                        <td className="px-2 py-1 text-slate-600">{indicator.targetValue || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {initiatives.length === 0 && (
            <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
              {t("empty")}
            </p>
          )}
        </div>
      </main>
    </AppShell>
  );
}
