"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createAcademicYearAction, type ActionState } from "@/actions/school-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function CreateAcademicYearForm() {
  const t = useTranslations("academicYearsPage");
  const [state, action, pending] = useActionState<ActionState, FormData>(createAcademicYearAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input id="name" name="name" placeholder={t("namePlaceholder")} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">{t("startDate")}</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endDate">{t("endDate")}</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="isActive" />
        {t("makeActive")}
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{t("created")}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
