import { prisma } from "@/lib/prisma";

const CACHE_TTL_MS = 30_000;
let cache: { overridesByLocale: Record<string, Record<string, string>>; expiresAt: number } | null = null;

async function loadOverrides(): Promise<Record<string, Record<string, string>>> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.overridesByLocale;
  }
  const rows = await prisma.translationOverride.findMany();
  const overridesByLocale: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    overridesByLocale[row.locale] ??= {};
    overridesByLocale[row.locale][row.key] = row.value;
  }
  cache = { overridesByLocale, expiresAt: Date.now() + CACHE_TTL_MS };
  return overridesByLocale;
}

export async function getTranslationOverrides(locale: string): Promise<Record<string, string>> {
  const overridesByLocale = await loadOverrides();
  return overridesByLocale[locale] ?? {};
}

export function invalidateTranslationCache(): void {
  cache = null;
}
