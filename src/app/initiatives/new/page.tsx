import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateInitiativeForm } from "@/components/initiative/CreateInitiativeForm";
import { AppShell } from "@/components/layout/AppShell";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";

export default async function NewInitiativePage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("initiatives");
  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role);

  const assignableUsers = isManagement
    ? await (async () => {
        const schoolId = await getActiveSchoolId(session!);
        if (!schoolId) return [];
        return prisma.user.findMany({
          where: { schoolId, isActive: true, id: { not: user.id } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });
      })()
    : [];

  return (
      <AppShell userName={user.name} role={user.role} isManagement={isManagement}>
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">{t("newInitiative")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("newPageSubtitle")}</p>
        <div className="mt-6">
          <CreateInitiativeForm assignableUsers={assignableUsers} />
        </div>
      </main>
    </AppShell>
  );
}
