"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { deleteKnowledgeMemoryItemAction } from "@/actions/knowledgeMemory";
import { Button } from "@/components/ui/button";

type Item = {
  id: string;
  module: string;
  subjectName: string | null;
  gradeName: string | null;
  title: string;
  content: string;
  createdByName: string;
  createdById: string;
  createdAt: string;
};

export function KnowledgeMemoryList({ items, currentUserId }: { items: Item[]; currentUserId: string }) {
  const t = useTranslations("knowledgeMemory");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove(id: string) {
    startTransition(async () => {
      await deleteKnowledgeMemoryItemAction(id);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{t(`modules.${item.module}`)}</span>
                {item.subjectName && <span>{item.subjectName}</span>}
                {item.gradeName && <span>{item.gradeName}</span>}
              </div>
              <p className="mt-1 font-medium text-slate-800">{item.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-600">{item.content}</p>
              <p className="mt-1 text-xs text-slate-400">
                {item.createdByName} · {item.createdAt}
              </p>
            </div>
            {item.createdById === currentUserId && (
              <Button type="button" size="sm" variant="ghost" onClick={() => remove(item.id)} disabled={isPending}>
                {t("remove")}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
