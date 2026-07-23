import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isAppLocale } from "@/i18n/locale";
import { getTranslationOverrides } from "@/lib/translationOverrides";
import { applyOverrides, type MessageTree } from "@/lib/messageTree";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const baseMessages: MessageTree = (await import(`../../messages/${locale}.json`)).default;
  const overrides = await getTranslationOverrides(locale);

  return {
    locale,
    messages: applyOverrides(baseMessages, overrides),
  };
});
