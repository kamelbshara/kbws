import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { SchoolSwitcher } from "@/components/layout/SchoolSwitcher";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { BrandWaveLines } from "@/components/layout/BrandWaveLines";

export async function AppHeader({ userName, role }: { userName: string; role: string }) {
  const t = await getTranslations("common");

  return (
    <header className="relative flex items-center justify-between overflow-hidden border-b border-brand-gold/30 bg-brand-navy px-6 py-3 text-brand-cream">
      <BrandWaveLines />
      <Link href="/" className="relative flex items-center gap-2">
        <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 rounded-full" priority />
        <span className="text-sm font-semibold">{t("appName")}</span>
      </Link>
      <div className="relative flex items-center gap-4 text-sm">
        <SchoolSwitcher />
        <NotificationBell />
        <LocaleSwitcher />
        <span className="text-brand-cream/80">
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
