import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { CreateInitiativeForm } from "@/components/initiative/CreateInitiativeForm";
import { AppShell } from "@/components/layout/AppShell";

export default async function NewInitiativePage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("initiatives");

  return (
      <AppShell userName={user.name} role={user.role}>
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">{t("newInitiative")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("newPageSubtitle")}</p>
        <div className="mt-6">
          <CreateInitiativeForm />
        </div>
      </main>
    </AppShell>
  );
}
