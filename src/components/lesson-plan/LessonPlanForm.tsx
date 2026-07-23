"use client";

import { useActionState, useState } from "react";
import { createLessonPlanAction, type ActionState } from "@/actions/lesson-plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEACHING_STRATEGIES, TEACHING_TOOLS } from "@/lib/constants";

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
  const [state, action, pending] = useActionState<ActionState, FormData>(createLessonPlanAction, undefined);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState(outcomes[0]?.id ?? "");
  const [showOverride, setShowOverride] = useState(false);

  const selectedOutcome = outcomes.find((o) => o.id === selectedOutcomeId);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="timetableId" value={timetableId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="learningOutcomeId">Lesson / Learning Outcome</Label>
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
          {showOverride ? "Hide outcome override" : "Override this learning outcome"}
        </button>
        {showOverride && (
          <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
            <Label htmlFor="outcomeOverrideText">Custom Learning Outcome Text</Label>
            <Textarea id="outcomeOverrideText" name="outcomeOverrideText" rows={2} />
            <Label htmlFor="outcomeOverrideReason">Reason for Override</Label>
            <Input id="outcomeOverrideReason" name="outcomeOverrideReason" placeholder="e.g. re-teaching a skill gap" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="lessonDate">Lesson Date</Label>
          <Input id="lessonDate" name="lessonDate" type="date" defaultValue={today} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="durationMinutes">Duration (minutes)</Label>
          <Input id="durationMinutes" name="durationMinutes" type="number" defaultValue={45} min={10} max={180} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="teacherPrompt">What do you want to focus on in this lesson?</Label>
        <Textarea
          id="teacherPrompt"
          name="teacherPrompt"
          rows={3}
          required
          placeholder="e.g. explain linear equations using a group activity and real-world examples"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label>Teaching Strategies</Label>
          <div className="flex flex-col gap-2">
            {TEACHING_STRATEGIES.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <Checkbox name="strategies" value={s} />
                {s}
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Teaching Tools</Label>
          <div className="flex flex-col gap-2">
            {TEACHING_TOOLS.map((tool) => (
              <label key={tool} className="flex items-center gap-2 text-sm">
                <Checkbox name="tools" value={tool} />
                {tool}
              </label>
            ))}
          </div>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creating..." : "Continue to AI Generation"}
      </Button>
    </form>
  );
}
