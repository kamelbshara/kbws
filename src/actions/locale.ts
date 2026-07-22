"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, isAppLocale } from "@/i18n/locale";

export async function setLocaleAction(formData: FormData) {
  const locale = formData.get("locale");
  const path = formData.get("path");
  const targetPath = typeof path === "string" && path.startsWith("/") ? path : "/";

  if (typeof locale === "string" && isAppLocale(locale)) {
    const cookieStore = await cookies();
    cookieStore.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  redirect(targetPath);
}
