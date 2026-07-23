import { getTranslations } from "next-intl/server";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { SchoolSwitcher } from "@/components/layout/SchoolSwitcher";

export async function AppHeader({ userName, role }: { userName: string; role: string }) {
  const t = await getTranslations("common");

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="text-sm font-semibold">{t("appName")}</div>
      <div className="flex items-center gap-4 text-sm">
        <SchoolSwitcher />
        <LocaleSwitcher />
        <span className="text-slate-600">
          {userName} · {role}
        </span>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            {t("signOut")}
          </Button>
        </form>
      </div>
    </header>
  );
}
