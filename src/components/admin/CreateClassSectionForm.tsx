"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createClassSectionAction, type ActionState } from "@/actions/school-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Grade = { id: string; name: string; level: number };

export function CreateClassSectionForm({ grades }: { grades: Grade[] }) {
  const t = useTranslations("classesPage");
  const [state, action, pending] = useActionState<ActionState, FormData>(createClassSectionAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="gradeId">{t("gradeLabel")}</Label>
        <Select name="gradeId" defaultValue={grades[0]?.id}>
          <SelectTrigger id="gradeId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {grades.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="track">{t("trackLabel")}</Label>
        <Select name="track" defaultValue="none">
          <SelectTrigger id="track">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("trackNone")}</SelectItem>
            <SelectItem value="GENERAL">{t("trackGeneral")}</SelectItem>
            <SelectItem value="ADVANCED">{t("trackAdvanced")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("sectionName")}</Label>
        <Input id="name" name="name" placeholder={t("sectionPlaceholder")} required />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{t("created")}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
