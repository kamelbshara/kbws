import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WeeklyScheduleGrid } from "@/components/schedule/WeeklyScheduleGrid";
import { AppShell } from "@/components/layout/AppShell";
import { startOfWeek, dateForDayInWeek } from "@/lib/weekDates";

export default async function SchedulePage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("schedule");

  const academicYear = await prisma.academicYear.findFirst({ where: { isActive: true } });

  const slots = academicYear
    ? await prisma.timetable.findMany({
        where: { teacherId: user.id, academicYearId: academicYear.id },
        include: {
          subject: true,
          classSection: { include: { grade: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
      })
    : [];

  const weekStart = startOfWeek(new Date());
  const weekEnd = dateForDayInWeek(weekStart, "SATURDAY");
  weekEnd.setDate(weekEnd.getDate() + 1);

  const weekLessonPlans =
    slots.length > 0
      ? await prisma.lessonPlan.findMany({
          where: {
            teacherId: user.id,
            timetableId: { in: slots.map((s) => s.id) },
            lessonDate: { gte: weekStart, lt: weekEnd },
          },
          include: { curriculumContent: true },
        })
      : [];

  return (
      <AppShell userName={user.name} role={user.role}>
      <main className="p-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("dragDropHint")}</p>
        <div className="mt-4">
          {slots.length > 0 ? (
            <WeeklyScheduleGrid slots={slots} weekStartIso={weekStart.toISOString()} lessonPlans={weekLessonPlans.map((lp) => ({
              id: lp.id,
              timetableId: lp.timetableId!,
              lessonTitle: lp.curriculumContent.lessonTitle,
              status: lp.status,
            }))} />
          ) : (
            <p className="text-sm text-slate-600">{t("empty")}</p>
          )}
        </div>
      </main>
    </AppShell>
  );
}
