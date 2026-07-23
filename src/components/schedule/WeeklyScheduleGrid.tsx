import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { DayOfWeek } from "@/generated/prisma/enums";

type ScheduleSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string | null;
  endTime: string | null;
  subject: { name: string; nameAr: string };
  classSection: { name: string; grade: { name: string } };
};

const DAY_ORDER: DayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"];

export async function WeeklyScheduleGrid({ slots }: { slots: ScheduleSlot[] }) {
  const t = await getTranslations("timetablePage");
  const maxPeriod = Math.max(1, ...slots.map((s) => s.periodNumber));
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  const grid = new Map<string, ScheduleSlot>();
  for (const slot of slots) {
    grid.set(`${slot.dayOfWeek}-${slot.periodNumber}`, slot);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
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
                return (
                  <td key={day} className="border-b border-slate-100 px-3 py-3 align-top">
                    {slot ? (
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
    </div>
  );
}
