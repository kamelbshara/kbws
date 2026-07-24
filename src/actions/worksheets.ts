"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { UnauthorizedError } from "@/lib/permissions";
import { WorksheetContentSchema } from "@/lib/ai/worksheetSchema";

export type WorksheetActionState = { error?: string; success?: boolean } | undefined;

const updateSchema = z.object({
  worksheetId: z.string().min(1),
  content: WorksheetContentSchema,
});

export async function updateWorksheetContentAction(
  worksheetId: string,
  content: unknown,
): Promise<WorksheetActionState> {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const parsed = updateSchema.safeParse({ worksheetId, content });
  if (!parsed.success) {
    return { error: "Invalid worksheet content." };
  }

  const worksheet = await prisma.worksheet.findUnique({ where: { id: parsed.data.worksheetId } });
  if (!worksheet || worksheet.createdById !== session.user.id) {
    return { error: "Not found." };
  }

  await prisma.worksheet.update({
    where: { id: worksheet.id },
    data: { contentJson: parsed.data.content },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    module: "Worksheets",
    entityId: worksheet.id,
    before: { contentJson: worksheet.contentJson },
    after: { contentJson: parsed.data.content },
  });

  revalidatePath(`/worksheets/${worksheet.id}`);
  return { success: true };
}
