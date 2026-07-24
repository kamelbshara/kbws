import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { AppShell } from "@/components/layout/AppShell";

export default async function TeamsListPage() {
  const session = await auth();
  const user = session!.user;
  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role);
  const schoolId = await getActiveSchoolId(session!);
  const t = await getTranslations("teams");

  const teams =
    isManagement && !schoolId
      ? []
      : await prisma.team.findMany({
          where: isManagement ? { schoolId: schoolId as string } : { members: { some: { userId: user.id } } },
          include: { leader: true, members: true },
          orderBy: { createdAt: "desc" },
        });

  return (
      <AppShell userName={user.name} role={user.role} isManagement={isManagement}>
      <main className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{isManagement ? t("allTeams") : t("myTeams")}</h1>
          {isManagement && (
            <Button asChild>
              <Link href="/teams/new">{t("newTeam")}</Link>
            </Button>
          )}
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">{t("nameHeader")}</th>
                <th className="px-4 py-2 font-medium">{t("typeHeader")}</th>
                <th className="px-4 py-2 font-medium">{t("leaderHeader")}</th>
                <th className="px-4 py-2 font-medium">{t("membersHeader")}</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/teams/${team.id}`} className="font-medium hover:underline">
                      {team.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{t(`types.${team.type}`)}</td>
                  <td className="px-4 py-2 text-slate-600">{team.leader.name}</td>
                  <td className="px-4 py-2 text-slate-600">{team.members.length}</td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </AppShell>
  );
}
