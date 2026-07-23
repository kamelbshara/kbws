"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRole, ADMIN_ROLES } from "@/lib/permissions";
import { ACTIVE_SCHOOL_COOKIE, isPlatformAdmin } from "@/lib/activeSchool";

export type ActionState = { error?: string } | undefined;

const createSchoolSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().min(2),
  address: z.string().optional(),
});

export async function createSchoolAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  requireRole(session, ADMIN_ROLES);

  const parsed = createSchoolSchema.safeParse({
    name: formData.get("name"),
    nameAr: formData.get("nameAr"),
    address: formData.get("address") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const school = await prisma.school.create({ data: parsed.data });

  await logAudit({
    userId: session!.user.id,
    action: "CREATE",
    module: "Schools",
    entityId: school.id,
    after: { name: school.name },
  });

  revalidatePath("/admin/schools");
  redirect("/admin/schools");
}

export async function setActiveSchoolAction(schoolId: string): Promise<void> {
  const session = await auth();
  if (!session?.user || !isPlatformAdmin(session)) {
    throw new Error("Only platform admins can switch schools.");
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } });
  if (!school) {
    throw new Error("School not found.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SCHOOL_COOKIE, schoolId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/");
}
