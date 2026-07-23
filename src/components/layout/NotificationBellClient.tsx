"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/actions/notifications";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBellClient({
  unreadCount,
  notifications,
}: {
  unreadCount: number;
  notifications: NotificationItem[];
}) {
  const t = useTranslations("notificationsWidget");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function openNotification(n: NotificationItem) {
    startTransition(async () => {
      if (!n.read) {
        await markNotificationReadAction(n.id);
      }
      if (n.link) {
        router.push(n.link);
      }
      router.refresh();
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden">
        <span className="relative inline-flex">
          <Bell className="h-4 w-4 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <span className="text-sm font-medium">{t("title")}</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={isPending}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              {t("markAllRead")}
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-slate-400">{t("empty")}</p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              disabled={isPending}
              className={`block w-full border-b border-slate-50 px-3 py-2 text-left text-sm last:border-0 hover:bg-slate-50 ${
                n.read ? "text-slate-500" : "bg-blue-50/50 font-medium text-slate-900"
              }`}
            >
              <p>{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs font-normal text-slate-500">{n.body}</p>}
              <p className="mt-0.5 text-xs font-normal text-slate-400" dir="ltr">
                {new Date(n.createdAt).toISOString().replace("T", " ").slice(0, 16)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
