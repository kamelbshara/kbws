"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { saveUploadedFile, isAllowedUploadType, MAX_UPLOAD_BYTES } from "@/lib/storage";

export type ActionState = { error?: string; success?: boolean } | undefined;

const uploadSchema = z.object({
  title: z.string().min(2),
  structureJson: z.string().optional(),
});

export async function uploadLessonPlanTemplateAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  await requireRoleGroup(session, "MANAGEMENT_ROLES");
  const schoolId = await getActiveSchoolId(session!);
  if (!schoolId) {
    return { error: "No active school selected." };
  }

  const parsed = uploadSchema.safeParse({
    title: formData.get("title"),
    structureJson: formData.get("structureNotes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let stored: { url: string; fileName: string } | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: "File is too large (max 10MB)." };
    }
    if (!isAllowedUploadType(file.type)) {
      return { error: "Unsupported file type. Allowed: images, PDF, and Word documents." };
    }
    stored = await saveUploadedFile(file, "lesson-plan-templates");
  }

  await prisma.lessonPlanTemplate.updateMany({
    where: { schoolId, isActive: true },
    data: { isActive: false },
  });

  const template = await prisma.lessonPlanTemplate.create({
    data: {
      schoolId,
      title: parsed.data.title,
      fileUrl: stored?.url,
      fileName: stored?.fileName,
      structureJson: parsed.data.structureJson ? { notes: parsed.data.structureJson } : undefined,
      isActive: true,
      createdById: session!.user.id,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CREATE",
    module: "LessonPlanTemplate",
    entityId: template.id,
    after: { title: template.title, schoolId },
  });

  revalidatePath("/admin/lesson-plan-template");
  return { success: true };
}
