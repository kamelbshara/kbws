"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });

  revalidatePath("/");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/");
}
