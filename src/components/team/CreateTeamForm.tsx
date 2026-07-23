"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createTeamAction, type ActionState } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEAM_TYPES } from "@/lib/teamLabels";

export function CreateTeamForm() {
  const t = useTranslations("teams");
  const [state, action, pending] = useActionState<ActionState, FormData>(createTeamAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("formNameLabel")}</Label>
        <Input id="name" name="name" required placeholder={t("formNamePlaceholder")} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="type">{t("typeLabel")}</Label>
        <Select name="type" defaultValue="ACADEMIC">
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEAM_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`types.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="goal">{t("goalLabel")}</Label>
        <Textarea id="goal" name="goal" rows={3} placeholder={t("goalPlaceholder")} />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
