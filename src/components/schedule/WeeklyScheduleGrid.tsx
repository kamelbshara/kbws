"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { copyLessonPlanToSlotAction } from "@/actions/lesson-plans";
import type { DayOfWeek } from "@/generated/prisma/enums";
import { dateForDayInWeek, toDateKey } from "@/lib/weekDates";

type ScheduleSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string | null;
  endTime: string | null;
  subject: { name: string; nameAr: string };
  classSection: { name: string; grade: { name: string } };
};

type WeekLessonPlan = {
  id: string;
  timetableId: string;
  lessonTitle: string;
  status: string;
};

const DAY_ORDER: DayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"];

export function WeeklyScheduleGrid({
  slots,
  weekStartIso,
  lessonPlans,
}: {
  slots: ScheduleSlot[];
  weekStartIso: string;
  lessonPlans: WeekLessonPlan[];
}) {
  const t = useTranslations("timetablePage");
  const sched = useTranslations("schedule");
  const router = useRouter();
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekStart = new Date(weekStartIso);
  const maxPeriod = Math.max(1, ...slots.map((s) => s.periodNumber));
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  const grid = new Map<string, ScheduleSlot>();
  for (const slot of slots) {
    grid.set(`${slot.dayOfWeek}-${slot.periodNumber}`, slot);
  }
  const plansByTimetableId = new Map<string, WeekLessonPlan>();
  for (const lp of lessonPlans) {
    plansByTimetableId.set(lp.timetableId, lp);
  }

  async function handleDrop(targetSlot: ScheduleSlot, sourceLessonPlanId: string) {
    setDragOverSlotId(null);
    if (!sourceLessonPlanId) return;
    if (plansByTimetableId.has(targetSlot.id)) {
      setError(sched("slotAlreadyHasPlan"));
      return;
    }
    setCopying(true);
    setError(null);
    try {
      const targetDate = toDateKey(dateForDayInWeek(weekStart, targetSlot.dayOfWeek));
      const result = await copyLessonPlanToSlotAction(sourceLessonPlanId, targetSlot.id, targetDate);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      {error && <p className="border-b border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-e border-slate-200 bg-slate-50 px-3 py-2 text-start font-medium text-slate-500">
              {t("period")}
            </th>
            {DAY_ORDER.map((day) => (
              <th
                key={day}
                className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-start font-medium text-slate-500"
              >
                {t(`days.${day}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period}>
              <td className="border-e border-b border-slate-100 px-3 py-3 font-medium text-slate-500">{period}</td>
              {DAY_ORDER.map((day) => {
                const slot = grid.get(`${day}-${period}`);
                const lessonPlan = slot ? plansByTimetableId.get(slot.id) : undefined;
                const isDragOver = slot ? dragOverSlotId === slot.id : false;
                return (
                  <td
                    key={day}
                    className={`border-b border-slate-100 px-3 py-3 align-top ${isDragOver ? "bg-brand-cream" : ""}`}
                    onDragOver={(e) => {
                      if (!slot) return;
                      e.preventDefault();
                      setDragOverSlotId(slot.id);
                    }}
                    onDragLeave={() => setDragOverSlotId((current) => (current === slot?.id ? null : current))}
                    onDrop={(e) => {
                      e.preventDefault();
                      const sourceLessonPlanId = e.dataTransfer.getData("text/plain");
                      if (slot && sourceLessonPlanId) void handleDrop(slot, sourceLessonPlanId);
                    }}
                  >
                    {slot ? (
                      lessonPlan ? (
                        <Link
                          href={`/lesson-plans/${lessonPlan.id}`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", lessonPlan.id);
                            e.dataTransfer.effectAllowed = "copy";
                          }}
                          className="block cursor-grab rounded-md border border-brand-gold/40 bg-brand-cream/60 p-2 hover:border-brand-gold active:cursor-grabbing"
                        >
                          <div className="font-medium">{lessonPlan.lessonTitle}</div>
                          <div className="text-xs text-slate-500">
                            {slot.subject.name} · {slot.classSection.grade.name} · {slot.classSection.name}
                          </div>
                        </Link>
                      ) : (
                        <Link
                          href={`/lesson-plans/new?timetableId=${slot.id}`}
                          className="block rounded-md border border-slate-200 bg-slate-50 p-2 hover:border-slate-400 hover:bg-white"
                        >
                          <div className="font-medium">{slot.subject.name}</div>
                          <div className="text-xs text-slate-500">
                            {slot.classSection.grade.name} · {slot.classSection.name}
                          </div>
                          {slot.startTime && (
                            <div className="text-xs text-slate-400" dir="ltr">
                              {slot.startTime}–{slot.endTime}
                            </div>
                          )}
                        </Link>
                      )
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {copying && <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">{sched("copying")}</p>}
    </div>
  );
}
