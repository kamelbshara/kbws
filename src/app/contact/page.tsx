import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

const MAP_URL = "https://share.google/vmKS0IlzDklTeqXVw";

export default async function ContactPage() {
  const t = await getTranslations("contactPage");
  const email = process.env.CONTACT_EMAIL;
  const phone = t("phone");

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
        <h1 className="text-3xl font-semibold text-brand-navy">{t("title")}</h1>
        <div className="flex flex-col gap-4 rounded-lg border border-brand-gold/30 bg-white p-6">
          <div>
            <h2 className="text-sm font-semibold text-brand-navy">{t("addressTitle")}</h2>
            <p className="mt-1 text-slate-700">{t("address")}</p>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm text-slate-600 underline"
            >
              {t("mapLink")}
            </a>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-brand-navy">{t("emailTitle")}</h2>
            {email ? (
              <a href={`mailto:${email}`} className="mt-1 block text-slate-700 underline">
                {email}
              </a>
            ) : (
              <p className="mt-1 text-slate-500">{t("notConfigured")}</p>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-brand-navy">{t("phoneTitle")}</h2>
            <a href={`tel:+971${phone.slice(1)}`} className="mt-1 block text-slate-700 underline" dir="ltr">
              {phone}
            </a>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-brand-navy">{t("hoursTitle")}</h2>
            <p className="mt-1 text-slate-700">{t("hours")}</p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
