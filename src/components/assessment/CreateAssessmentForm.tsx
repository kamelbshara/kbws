"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createAssessmentAction, type ActionState } from "@/actions/assessments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateAssessmentForm({ lessonPlanId, defaultTitle }: { lessonPlanId: string; defaultTitle: string }) {
  const t = useTranslations("assessments");
  const [state, action, pending] = useActionState<ActionState, FormData>(createAssessmentAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="lessonPlanId" value={lessonPlanId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t("titleLabel")}</Label>
        <Input id="title" name="title" required defaultValue={defaultTitle} />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
