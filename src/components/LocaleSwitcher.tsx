"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { setLocaleAction } from "@/actions/locale";
import { LOCALES } from "@/i18n/locale";

const LABELS: Record<string, string> = { ar: "العربية", en: "English" };

export function LocaleSwitcher() {
  const pathname = usePathname();
  const activeLocale = useLocale();

  return (
    <form action={setLocaleAction} className="flex items-center gap-1 text-sm">
      <input type="hidden" name="path" value={pathname} />
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="submit"
          name="locale"
          value={locale}
          className={
            locale === activeLocale
              ? "font-semibold underline underline-offset-2"
              : "text-slate-500 hover:text-slate-900"
          }
        >
          {LABELS[locale]}
        </button>
      ))}
    </form>
  );
}
