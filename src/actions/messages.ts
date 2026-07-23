"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { createNotification } from "@/lib/notifications";

export type ActionState = { error?: string; success?: boolean } | undefined;

const sendMessageSchema = z.object({
  recipientId: z.string().min(1),
  subject: z.string().min(2),
  body: z.string().min(1),
});

export async function sendMessageAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const parsed = sendMessageSchema.safeParse({
    recipientId: formData.get("recipientId"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const schoolId = await getActiveSchoolId(session);
  const recipient = await prisma.user.findUnique({ where: { id: parsed.data.recipientId } });
  if (!recipient || recipient.schoolId !== schoolId) {
    return { error: "This recipient does not belong to your school." };
  }
  if (recipient.id === session.user.id) {
    return { error: "You cannot send a message to yourself." };
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      recipientId: recipient.id,
      subject: parsed.data.subject,
      body: parsed.data.body,
    },
  });

  await createNotification({
    userId: recipient.id,
    type: "MESSAGE_RECEIVED",
    title: `New message: "${parsed.data.subject}"`,
    link: "/messages",
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    module: "Messages",
    entityId: message.id,
    after: { recipientId: recipient.id, subject: parsed.data.subject },
  });

  revalidatePath("/messages");
  return { success: true };
}

export async function markMessageReadAction(messageId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.recipientId !== session.user.id || message.read) return;

  await prisma.message.update({ where: { id: messageId }, data: { read: true } });
  revalidatePath("/messages");
}
