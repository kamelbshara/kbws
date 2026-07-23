"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FeedbackRating } from "@/generated/prisma/enums";

export async function submitAIFeedbackAction(
  generationLogId: string,
  rating: FeedbackRating,
  comment?: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const log = await prisma.aIGenerationLog.findUnique({ where: { id: generationLogId } });
  if (!log || log.userId !== session.user.id) {
    return { error: "This generation does not belong to you." };
  }

  await prisma.aIFeedback.upsert({
    where: { generationLogId_userId: { generationLogId, userId: session.user.id } },
    create: { generationLogId, userId: session.user.id, rating, comment },
    update: { rating, comment },
  });

  revalidatePath("/admin/audit-log");
  return {};
}
