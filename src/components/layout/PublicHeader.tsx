import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { BrandWaveLines } from "@/components/layout/BrandWaveLines";

export async function PublicHeader() {
  const t = await getTranslations("common");

  return (
    <header className="relative flex items-center justify-between overflow-hidden border-b border-brand-gold/30 bg-brand-navy px-6 py-3 text-brand-cream">
      <BrandWaveLines />
      <Link href="/login" className="relative flex items-center gap-3">
        <Image src="/logo.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full" priority />
        <span className="text-sm font-semibold sm:text-base">{t("appName")}</span>
      </Link>
      <div className="relative">
        <LocaleSwitcher />
      </div>
    </header>
  );
}
