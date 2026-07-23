import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandWaveLines } from "@/components/layout/BrandWaveLines";

export async function PublicFooter() {
  const t = await getTranslations("publicSite");

  return (
    <footer className="relative overflow-hidden border-t border-brand-gold/30 bg-brand-navy px-6 py-8 text-brand-cream">
      <BrandWaveLines />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
        <nav className="flex flex-wrap justify-center gap-6 text-sm">
          <Link href="/vision" className="hover:text-brand-gold-light">
            {t("footer.vision")}
          </Link>
          <Link href="/privacy" className="hover:text-brand-gold-light">
            {t("footer.privacy")}
          </Link>
          <Link href="/terms" className="hover:text-brand-gold-light">
            {t("footer.terms")}
          </Link>
          <Link href="/contact" className="hover:text-brand-gold-light">
            {t("footer.contact")}
          </Link>
        </nav>
        <p className="max-w-xl text-xs text-brand-cream/70">{t("footer.governmentNote")}</p>
        <p className="text-xs text-brand-cream/50">
          {t("schoolNameEn")} — {t("schoolNameAr")} · {t("footer.rightsReserved")}
        </p>
      </div>
    </footer>
  );
}
