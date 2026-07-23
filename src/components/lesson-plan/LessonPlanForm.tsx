"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createLessonPlanAction, type ActionState } from "@/actions/lesson-plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEACHING_STRATEGIES, TEACHING_STRATEGY_KEYS, TEACHING_TOOLS, TEACHING_TOOL_KEYS } from "@/lib/constants";

type LearningOutcomeOption = {
  id: string;
  lessonTitle: string;
  unitTitle: string;
  textEn: string;
  textAr: string;
};

export function LessonPlanForm({
  timetableId,
  outcomes,
}: {
  timetableId: string;
  outcomes: LearningOutcomeOption[];
}) {
  const t = useTranslations("lessonPlan");
  const [state, action, pending] = useActionState<ActionState, FormData>(createLessonPlanAction, undefined);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState(outcomes[0]?.id ?? "");
  const [showOverride, setShowOverride] = useState(false);

  const selectedOutcome = outcomes.find((o) => o.id === selectedOutcomeId);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="timetableId" value={timetableId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="learningOutcomeId">{t("selectOutcome")}</Label>
        <Select name="learningOutcomeId" value={selectedOutcomeId} onValueChange={setSelectedOutcomeId}>
          <SelectTrigger id="learningOutcomeId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {outcomes.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.unitTitle} — {o.lessonTitle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedOutcome && (
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600" dir="rtl">
            {selectedOutcome.textAr}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowOverride((v) => !v)}
          className="w-fit text-xs text-slate-500 underline"
        >
          {showOverride ? t("hideOverride") : t("showOverride")}
        </button>
        {showOverride && (
          <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
            <Label htmlFor="outcomeOverrideText">{t("customOutcomeText")}</Label>
            <Textarea id="outcomeOverrideText" name="outcomeOverrideText" rows={2} />
            <Label htmlFor="outcomeOverrideReason">{t("overrideReason")}</Label>
            <Input id="outcomeOverrideReason" name="outcomeOverrideReason" placeholder={t("overrideReasonPlaceholder")} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="lessonDate">{t("lessonDate")}</Label>
          <Input id="lessonDate" name="lessonDate" type="date" defaultValue={today} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="durationMinutes">{t("duration")}</Label>
          <Input id="durationMinutes" name="durationMinutes" type="number" defaultValue={45} min={10} max={180} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="teacherPrompt">{t("promptLabel")}</Label>
        <Textarea id="teacherPrompt" name="teacherPrompt" rows={3} required placeholder={t("promptPlaceholder")} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label>{t("strategies")}</Label>
          <div className="flex flex-col gap-2">
            {TEACHING_STRATEGIES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <Checkbox name="strategies" value={s} />
                {t(`strategies_options.${TEACHING_STRATEGY_KEYS[s]}`)}
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("tools")}</Label>
          <div className="flex flex-col gap-2">
            {TEACHING_TOOLS.map((tool) => (
              <label key={tool} className="flex items-center gap-2 text-sm">
                <Checkbox name="tools" value={tool} />
                {t(`tools_options.${TEACHING_TOOL_KEYS[tool]}`)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("creating") : t("continueToGeneration")}
      </Button>
    </form>
  );
}
