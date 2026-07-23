import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WeeklyScheduleGrid } from "@/components/schedule/WeeklyScheduleGrid";
import { AppShell } from "@/components/layout/AppShell";

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

  return (
      <AppShell userName={user.name} role={user.role}>
      <main className="p-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <div className="mt-4">
          {slots.length > 0 ? (
            <WeeklyScheduleGrid slots={slots} />
          ) : (
            <p className="text-sm text-slate-600">{t("empty")}</p>
          )}
        </div>
      </main>
    </AppShell>
  );
}
