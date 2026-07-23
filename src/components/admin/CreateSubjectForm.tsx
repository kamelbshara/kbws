"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createSubjectAction, type ActionState } from "@/actions/masterData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateSubjectForm() {
  const t = useTranslations("masterDataPage");
  const [state, action, pending] = useActionState<ActionState, FormData>(createSubjectAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="subjectName">{t("subjectName")}</Label>
        <Input id="subjectName" name="name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="subjectNameAr">{t("subjectNameAr")}</Label>
        <Input id="subjectNameAr" name="nameAr" dir="rtl" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="subjectCode">{t("subjectCode")}</Label>
        <Input id="subjectCode" name="code" placeholder={t("subjectCodePlaceholder")} required />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{t("subjectCreated")}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("creating") : t("createSubjectTitle")}
      </Button>
    </form>
  );
}
