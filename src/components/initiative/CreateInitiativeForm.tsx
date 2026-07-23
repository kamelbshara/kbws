"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createInitiativeAction, type ActionState } from "@/actions/initiatives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INITIATIVE_CATEGORIES } from "@/lib/initiativeLabels";

export function CreateInitiativeForm() {
  const t = useTranslations("initiatives");
  const [state, action, pending] = useActionState<ActionState, FormData>(createInitiativeAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t("formNameLabel")}</Label>
        <Input id="title" name="title" required placeholder={t("formNamePlaceholder")} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category">{t("formCategoryLabel")}</Label>
        <Select name="category" defaultValue="EDUCATIONAL">
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INITIATIVE_CATEGORIES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`categories.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="initialIdea">{t("formIdeaLabel")}</Label>
        <Textarea id="initialIdea" name="initialIdea" rows={4} required placeholder={t("formIdeaPlaceholder")} />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
