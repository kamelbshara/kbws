"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { UnauthorizedError } from "@/lib/permissions";

export type ActionState = { error?: string; success?: boolean } | undefined;

const selectSchema = z.object({
  professionalGoalId: z.string().min(1),
  selectedGoal: z.string().min(2),
});

export async function selectProfessionalGoalAction(professionalGoalId: string, selectedGoal: string): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const parsed = selectSchema.safeParse({ professionalGoalId, selectedGoal });
  if (!parsed.success) {
    return { error: "Invalid selection." };
  }

  const goal = await prisma.professionalGoal.findUnique({ where: { id: parsed.data.professionalGoalId } });
  if (!goal || goal.userId !== session.user.id) {
    return { error: "Not found." };
  }

  const suggestions = Array.isArray(goal.suggestions) ? (goal.suggestions as unknown[]) : [];
  if (!suggestions.includes(parsed.data.selectedGoal)) {
    return { error: "That goal wasn't among the suggestions." };
  }

  await prisma.professionalGoal.update({
    where: { id: goal.id },
    data: { selectedGoal: parsed.data.selectedGoal },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    module: "ProfessionalGoals",
    entityId: goal.id,
    after: { selectedGoal: parsed.data.selectedGoal },
  });

  revalidatePath("/professional-goals");
  return { success: true };
}
