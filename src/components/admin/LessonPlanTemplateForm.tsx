"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { uploadLessonPlanTemplateAction, type ActionState } from "@/actions/lessonPlanTemplate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function LessonPlanTemplateForm() {
  const t = useTranslations("lessonPlanTemplatePage");
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadLessonPlanTemplateAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t("titleLabel")}</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="structureNotes">{t("structureNotesLabel")}</Label>
        <Textarea id="structureNotes" name="structureNotes" rows={4} placeholder={t("structureNotesPlaceholder")} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">{t("fileLabel")}</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          className="rounded-md border border-slate-300 bg-white p-2 text-sm"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("uploading") : t("upload")}
      </Button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{t("uploaded")}</p>}
    </form>
  );
}
