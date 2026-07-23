import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    },
  });
}

export async function createNotifications(
  userIds: string[],
  params: { type: string; title: string; body?: string; link?: string },
): Promise<void> {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...params })),
  });
}
