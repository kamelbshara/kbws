"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addTeamMemberAction, type ActionState } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Candidate = { id: string; name: string };

export function AddMemberForm({ teamId, candidates }: { teamId: string; candidates: Candidate[] }) {
  const t = useTranslations("teams");
  const [state, action, pending] = useActionState<ActionState, FormData>(addTeamMemberAction, undefined);

  if (candidates.length === 0) {
    return <p className="text-xs text-slate-400">{t("allAlreadyMembers")}</p>;
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="teamId" value={teamId} />
      <Select name="userId" defaultValue={candidates[0]?.id}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {candidates.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? t("adding") : t("addMember")}
      </Button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
