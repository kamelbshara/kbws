import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainNav } from "@/components/layout/MainNav";
import { Button } from "@/components/ui/button";
import { getRoleGroup } from "@/lib/permissions";
import { TEAM_TYPE_LABELS } from "@/lib/teamLabels";

export default async function TeamsListPage() {
  const session = await auth();
  const user = session!.user;
  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role);

  const teams = await prisma.team.findMany({
    where: isManagement ? {} : { members: { some: { userId: user.id } } },
    include: { leader: true, members: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <MainNav role={user.role} />
      <main className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{isManagement ? "All Teams" : "My Teams"}</h1>
          <Button asChild>
            <Link href="/teams/new">New Team</Link>
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Leader</th>
                <th className="px-4 py-2 font-medium">Members</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/teams/${t.id}`} className="font-medium hover:underline">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{TEAM_TYPE_LABELS[t.type]}</td>
                  <td className="px-4 py-2 text-slate-600">{t.leader.name}</td>
                  <td className="px-4 py-2 text-slate-600">{t.members.length}</td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No teams yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
