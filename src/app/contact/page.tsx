import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default async function ContactPage() {
  const t = await getTranslations("contactPage");
  const email = process.env.CONTACT_EMAIL;
  const phone = process.env.CONTACT_PHONE;

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
        <h1 className="text-3xl font-semibold text-brand-navy">{t("title")}</h1>
        <div className="flex flex-col gap-4 rounded-lg border border-brand-gold/30 bg-white p-6">
          <div>
            <h2 className="text-sm font-semibold text-brand-navy">{t("addressTitle")}</h2>
            <p className="mt-1 text-slate-700">{t("address")}</p>
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
            {phone ? (
              <a href={`tel:${phone}`} className="mt-1 block text-slate-700 underline" dir="ltr">
                {phone}
              </a>
            ) : (
              <p className="mt-1 text-slate-500">{t("notConfigured")}</p>
            )}
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
