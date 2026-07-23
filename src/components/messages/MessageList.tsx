"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { markMessageReadAction } from "@/actions/messages";

type MessageRow = {
  id: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
  counterpartName: string;
};

export function MessageList({
  messages,
  showSent,
}: {
  messages: MessageRow[];
  showSent: boolean;
  currentUserId: string;
}) {
  const t = useTranslations("messages");
  const [, startTransition] = useTransition();

  function onOpen(id: string, read: boolean) {
    if (showSent || read) return;
    startTransition(() => {
      markMessageReadAction(id);
    });
  }

  if (messages.length === 0) {
    return <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {messages.map((m) => (
        <details
          key={m.id}
          onToggle={(e) => e.currentTarget.open && onOpen(m.id, m.read)}
          className="rounded-md border border-slate-200 bg-white p-3 text-sm"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-2">
            <span className={!showSent && !m.read ? "font-semibold text-slate-900" : "text-slate-700"}>
              {m.subject}
            </span>
            <span className="shrink-0 text-xs text-slate-400">
              {showSent ? `${t("to")} ${m.counterpartName}` : `${t("from")} ${m.counterpartName}`} · {m.createdAt}
            </span>
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-slate-600">{m.body}</p>
        </details>
      ))}
    </div>
  );
}
