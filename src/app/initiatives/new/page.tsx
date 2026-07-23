import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainNav } from "@/components/layout/MainNav";
import { CreateInitiativeForm } from "@/components/initiative/CreateInitiativeForm";

export default async function NewInitiativePage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("initiatives");

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <MainNav role={user.role} />
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">{t("newInitiative")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("newPageSubtitle")}</p>
        <div className="mt-6">
          <CreateInitiativeForm />
        </div>
      </main>
    </div>
  );
}
