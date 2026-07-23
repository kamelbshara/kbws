"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createSchoolAction, type ActionState } from "@/actions/schools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateSchoolForm() {
  const t = useTranslations("schoolsPage");
  const [state, action, pending] = useActionState<ActionState, FormData>(createSchoolAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t("nameEnglish")}</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nameAr">{t("nameArabic")}</Label>
        <Input id="nameAr" name="nameAr" dir="rtl" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="address">{t("address")}</Label>
        <Input id="address" name="address" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
