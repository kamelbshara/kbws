"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { ADMIN_ROLES } from "@/lib/permissions";
import { ForbiddenError } from "@/lib/permissions";

export type ActionState = { error?: string; success?: boolean } | undefined;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    throw new ForbiddenError("Only platform administrators can manage master data.");
  }
  return session;
}

const createSubjectSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().min(2),
  code: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Za-z0-9_-]+$/, "Code must be letters, numbers, hyphens, or underscores."),
});

export async function createSubjectAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();

  const parsed = createSubjectSchema.safeParse({
    name: formData.get("name"),
    nameAr: formData.get("nameAr"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.subject.findUnique({ where: { code: parsed.data.code.toUpperCase() } });
  if (existing) {
    return { error: "A subject with this code already exists." };
  }

  const subject = await prisma.subject.create({
    data: { name: parsed.data.name, nameAr: parsed.data.nameAr, code: parsed.data.code.toUpperCase() },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    module: "MasterData.Subjects",
    entityId: subject.id,
    after: { name: subject.name, code: subject.code },
  });

  revalidatePath("/admin/master-data");
  return { success: true };
}

const createGradeSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().min(1),
  level: z.coerce.number().int().min(1).max(12),
});

export async function createGradeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireAdmin();

  const parsed = createGradeSchema.safeParse({
    name: formData.get("name"),
    nameAr: formData.get("nameAr"),
    level: formData.get("level"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.grade.findUnique({ where: { level: parsed.data.level } });
  if (existing) {
    return { error: "A grade with this level already exists." };
  }

  const grade = await prisma.grade.create({
    data: { name: parsed.data.name, nameAr: parsed.data.nameAr, level: parsed.data.level },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    module: "MasterData.Grades",
    entityId: grade.id,
    after: { name: grade.name, level: grade.level },
  });

  revalidatePath("/admin/master-data");
  return { success: true };
}
