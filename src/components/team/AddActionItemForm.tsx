"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addActionItemAction, type ActionState } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Member = { id: string; name: string };

export function AddActionItemForm({ meetingId, members }: { meetingId: string; members: Member[] }) {
  const t = useTranslations("teams");
  const [state, action, pending] = useActionState<ActionState, FormData>(addActionItemAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="meetingId" value={meetingId} />
      <Input name="task" required placeholder={t("taskPlaceholder")} className="min-w-[160px] flex-1" />
      <Select name="ownerId" defaultValue={members[0]?.id}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t("ownerPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="dueDate" type="date" className="w-40" />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? t("adding") : t("add")}
      </Button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
