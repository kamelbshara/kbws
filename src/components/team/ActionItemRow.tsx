"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateActionItemStatusAction } from "@/actions/teams";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTION_ITEM_STATUS_LABELS } from "@/lib/teamLabels";

export function ActionItemRow({
  actionItemId,
  task,
  ownerName,
  dueDate,
  status,
}: {
  actionItemId: string;
  task: string;
  ownerName: string;
  dueDate: string | null;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onStatusChange(value: string) {
    startTransition(async () => {
      await updateActionItemStatusAction(actionItemId, value as "OPEN" | "IN_PROGRESS" | "DONE");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md bg-white p-2 text-sm">
      <span className="flex-1">{task}</span>
      <span className="text-slate-500">{ownerName}</span>
      {dueDate && (
        <span className="text-xs text-slate-400" dir="ltr">
          {dueDate}
        </span>
      )}
      <Select value={status} onValueChange={onStatusChange} disabled={isPending}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ACTION_ITEM_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
