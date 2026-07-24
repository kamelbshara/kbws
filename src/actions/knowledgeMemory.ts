"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { ForbiddenError } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { KNOWLEDGE_MODULES } from "@/lib/knowledgeMemory";

export type ActionState = { error?: string; success?: boolean } | undefined;

async function requireContributor() {
  const session = await auth();
  if (!session?.user) throw new ForbiddenError("Unauthorized");
  if (session.user.role !== "SYSTEM_ADMIN") {
    throw new ForbiddenError("Only the super admin can manage knowledge memory notes.");
  }
  return session;
}

const createSchema = z.object({
  module: z.enum(KNOWLEDGE_MODULES),
  subjectId: z.string().optional(),
  gradeId: z.string().optional(),
  title: z.string().min(3),
  content: z.string().min(10),
});

export async function createKnowledgeMemoryItemAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireContributor();

  const schoolId = await getActiveSchoolId(session);
  if (!schoolId) {
    return { error: "No school is associated with this account." };
  }

  const rawSubjectId = formData.get("subjectId");
  const rawGradeId = formData.get("gradeId");
  const parsed = createSchema.safeParse({
    module: formData.get("module"),
    subjectId: rawSubjectId && rawSubjectId !== "ANY" ? rawSubjectId : undefined,
    gradeId: rawGradeId && rawGradeId !== "ANY" ? rawGradeId : undefined,
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const item = await prisma.knowledgeMemoryItem.create({
    data: {
      schoolId,
      module: parsed.data.module,
      subjectId: parsed.data.subjectId || undefined,
      gradeId: parsed.data.gradeId || undefined,
      title: parsed.data.title,
      content: parsed.data.content,
      createdById: session.user.id,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    module: "KnowledgeMemory",
    entityId: item.id,
    after: { title: item.title, module: item.module },
  });

  revalidatePath("/knowledge-memory");
  return { success: true };
}

export async function deleteKnowledgeMemoryItemAction(itemId: string): Promise<ActionState> {
  const session = await requireContributor();

  const schoolId = await getActiveSchoolId(session);
  const item = await prisma.knowledgeMemoryItem.findUnique({ where: { id: itemId } });
  if (!item || item.schoolId !== schoolId) {
    return { error: "Not found." };
  }
  if (item.createdById !== session.user.id) {
    return { error: "You can only remove notes you added." };
  }

  await prisma.knowledgeMemoryItem.delete({ where: { id: itemId } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    module: "KnowledgeMemory",
    entityId: itemId,
    before: { title: item.title },
  });

  revalidatePath("/knowledge-memory");
  return { success: true };
}
