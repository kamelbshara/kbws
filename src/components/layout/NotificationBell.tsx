import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationBellClient } from "@/components/layout/NotificationBellClient";

export async function NotificationBell() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const [unreadCount, recent] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <NotificationBellClient
      unreadCount={unreadCount}
      notifications={recent.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}
