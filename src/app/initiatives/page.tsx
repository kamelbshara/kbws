import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainNav } from "@/components/layout/MainNav";
import { Button } from "@/components/ui/button";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";

export default async function InitiativesListPage() {
  const session = await auth();
  const user = session!.user;
  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role);
  const schoolId = await getActiveSchoolId(session!);
  const t = await getTranslations("initiatives");

  const initiatives =
    isManagement && !schoolId
      ? []
      : await prisma.initiative.findMany({
          where: isManagement ? { schoolId: schoolId as string } : { ownerId: user.id },
          include: { owner: true },
          orderBy: { createdAt: "desc" },
        });

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <MainNav role={user.role} />
      <main className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{isManagement ? t("allInitiatives") : t("myInitiatives")}</h1>
          <Button asChild>
            <Link href="/initiatives/new">{t("newInitiative")}</Link>
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">{t("titleHeader")}</th>
                <th className="px-4 py-2 font-medium">{t("categoryHeader")}</th>
                {isManagement && <th className="px-4 py-2 font-medium">{t("ownerHeader")}</th>}
                <th className="px-4 py-2 font-medium">{t("statusHeader")}</th>
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
                  <td className="px-4 py-2 text-slate-600">{t(`categories.${i.category}`)}</td>
                  {isManagement && <td className="px-4 py-2 text-slate-600">{i.owner.name}</td>}
                  <td className="px-4 py-2 text-slate-600">{t(`statuses.${i.status}`)}</td>
                </tr>
              ))}
              {initiatives.length === 0 && (
                <tr>
                  <td colSpan={isManagement ? 4 : 3} className="px-4 py-6 text-center text-slate-400">
                    {t("empty")}
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
