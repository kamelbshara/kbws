import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainNav } from "@/components/layout/MainNav";
import { Button } from "@/components/ui/button";
import { getRoleGroup } from "@/lib/permissions";
import { INITIATIVE_CATEGORY_LABELS, INITIATIVE_STATUS_LABELS } from "@/lib/initiativeLabels";

export default async function InitiativesListPage() {
  const session = await auth();
  const user = session!.user;
  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role);

  const initiatives = await prisma.initiative.findMany({
    where: isManagement ? {} : { ownerId: user.id },
    include: { owner: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <MainNav role={user.role} />
      <main className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{isManagement ? "All Initiatives" : "My Initiatives"}</h1>
          <Button asChild>
            <Link href="/initiatives/new">New Initiative</Link>
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Category</th>
                {isManagement && <th className="px-4 py-2 font-medium">Owner</th>}
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {initiatives.map((i) => (
                <tr key={i.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/initiatives/${i.id}`} className="font-medium hover:underline">
                      {i.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{INITIATIVE_CATEGORY_LABELS[i.category]}</td>
                  {isManagement && <td className="px-4 py-2 text-slate-600">{i.owner.name}</td>}
                  <td className="px-4 py-2 text-slate-600">{INITIATIVE_STATUS_LABELS[i.status]}</td>
                </tr>
              ))}
              {initiatives.length === 0 && (
                <tr>
                  <td colSpan={isManagement ? 4 : 3} className="px-4 py-6 text-center text-slate-400">
                    No initiatives yet.
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
