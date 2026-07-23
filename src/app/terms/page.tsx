import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

const SECTION_KEYS = [
  "acceptance",
  "authorizedUse",
  "accountResponsibility",
  "prohibitedUse",
  "intellectualProperty",
  "changes",
  "governingLaw",
] as const;

export default async function TermsPage() {
  const t = await getTranslations("termsPage");

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
        <div>
          <h1 className="text-3xl font-semibold text-brand-navy">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("updated")}</p>
        </div>
        {SECTION_KEYS.map((key) => (
          <div key={key}>
            <h2 className="text-xl font-semibold text-brand-navy">{t(`${key}.title`)}</h2>
            <p className="mt-2 leading-relaxed text-slate-700">{t(`${key}.body`)}</p>
          </div>
        ))}
      </main>
      <PublicFooter />
    </div>
  );
}
