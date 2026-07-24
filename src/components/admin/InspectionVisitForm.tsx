"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createInspectionVisitAction, type ActionState } from "@/actions/inspectionVisits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InspectionVisitForm({ classSections }: { classSections: { id: string; label: string }[] }) {
  const t = useTranslations("adminLessonPlansPage");
  const [state, action, pending] = useActionState<ActionState, FormData>(createInspectionVisitAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 p-4">
      <div className="flex flex-col gap-1">
        <Label>{t("classSection")}</Label>
        <Select name="classSectionId" required>
          <SelectTrigger className="w-56">
            <SelectValue placeholder={t("selectClass")} />
          </SelectTrigger>
          <SelectContent>
            {classSections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="scheduledDate">{t("visitDate")}</Label>
        <Input id="scheduledDate" name="scheduledDate" type="date" required className="w-44" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="notes">{t("visitNotes")}</Label>
        <Input id="notes" name="notes" className="w-64" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("scheduling") : t("scheduleVisit")}
      </Button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="w-full text-sm text-green-700">{t("visitScheduled")}</p>}
    </form>
  );
}
