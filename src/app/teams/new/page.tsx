import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { CreateTeamForm } from "@/components/team/CreateTeamForm";
import { AppShell } from "@/components/layout/AppShell";

export default async function NewTeamPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("teams");

  return (
      <AppShell userName={user.name} role={user.role}>
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">{t("newTeam")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("newPageSubtitle")}</p>
        <div className="mt-6">
          <CreateTeamForm />
        </div>
      </main>
    </AppShell>
  );
}
