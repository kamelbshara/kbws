"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRoleGroup } from "@/lib/permissions";
import { invalidateTranslationCache } from "@/lib/translationOverrides";

const updateSchema = z.object({
  locale: z.enum(["ar", "en"]),
  key: z.string().min(1),
  value: z.string().min(1, "Translation text cannot be empty."),
});

export async function updateTranslationAction(locale: string, key: string, value: string): Promise<{ error?: string }> {
  const session = await auth();
  await requireRoleGroup(session, "ADMIN_ROLES");

  const parsed = updateSchema.safeParse({ locale, key, value });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const existing = await prisma.translationOverride.findUnique({
    where: { locale_key: { locale: parsed.data.locale, key: parsed.data.key } },
  });

  await prisma.translationOverride.upsert({
    where: { locale_key: { locale: parsed.data.locale, key: parsed.data.key } },
    create: { locale: parsed.data.locale, key: parsed.data.key, value: parsed.data.value },
    update: { value: parsed.data.value },
  });

  invalidateTranslationCache();

  await logAudit({
    userId: session!.user.id,
    action: existing ? "UPDATE" : "CREATE",
    module: "Translations",
    entityId: `${parsed.data.locale}:${parsed.data.key}`,
    before: existing ? { value: existing.value } : undefined,
    after: { value: parsed.data.value },
  });

  revalidatePath("/admin/translations");
  return {};
}

export async function resetTranslationAction(locale: string, key: string): Promise<{ error?: string }> {
  const session = await auth();
  await requireRoleGroup(session, "ADMIN_ROLES");

  const parsed = z.object({ locale: z.enum(["ar", "en"]), key: z.string().min(1) }).safeParse({ locale, key });
  if (!parsed.success) {
    return { error: "Invalid input." };
  }

  const existing = await prisma.translationOverride.findUnique({
    where: { locale_key: { locale: parsed.data.locale, key: parsed.data.key } },
  });
  if (!existing) {
    return {};
  }

  await prisma.translationOverride.delete({ where: { id: existing.id } });
  invalidateTranslationCache();

  await logAudit({
    userId: session!.user.id,
    action: "DELETE",
    module: "Translations",
    entityId: `${parsed.data.locale}:${parsed.data.key}`,
    before: { value: existing.value },
  });

  revalidatePath("/admin/translations");
  return {};
}
