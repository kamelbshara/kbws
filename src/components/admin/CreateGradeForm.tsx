"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createGradeAction, type ActionState } from "@/actions/masterData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateGradeForm() {
  const t = useTranslations("masterDataPage");
  const [state, action, pending] = useActionState<ActionState, FormData>(createGradeAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="gradeLevel">{t("gradeLevel")}</Label>
        <Input id="gradeLevel" name="level" type="number" min={1} max={12} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="gradeName">{t("gradeName")}</Label>
        <Input id="gradeName" name="name" placeholder="e.g. Grade 13" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="gradeNameAr">{t("gradeNameAr")}</Label>
        <Input id="gradeNameAr" name="nameAr" dir="rtl" required />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{t("gradeCreated")}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("creating") : t("createGradeTitle")}
      </Button>
    </form>
  );
}
