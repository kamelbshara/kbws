import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

const VALUE_KEYS = ["innovation", "quality", "transparency", "excellence"] as const;

export default async function VisionPage() {
  const t = await getTranslations("visionPage");

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
        <div>
          <h1 className="text-3xl font-semibold text-brand-navy">{t("visionTitle")}</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-700">{t("visionText")}</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-brand-navy">{t("missionTitle")}</h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-700">{t("missionText")}</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-brand-navy">{t("valuesTitle")}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {VALUE_KEYS.map((key) => (
              <div key={key} className="rounded-lg border border-brand-gold/30 bg-white p-5">
                <h3 className="font-semibold text-brand-navy">{t(`values.${key}.title`)}</h3>
                <p className="mt-2 text-sm text-slate-600">{t(`values.${key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
