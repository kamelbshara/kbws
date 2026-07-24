import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { TeacherReportButton } from "@/components/admin/TeacherReportButton";
import { InspectionVisitForm } from "@/components/admin/InspectionVisitForm";
import { getActiveSchoolId } from "@/lib/activeSchool";

export default async function AdminLessonPlansPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("adminLessonPlansPage");
  const schoolId = await getActiveSchoolId(session!);

  const [lessonPlans, teachers, classSections, upcomingVisits] = schoolId
    ? await Promise.all([
        prisma.lessonPlan.findMany({
          where: { teacher: { schoolId } },
          include: {
            teacher: true,
            curriculumContent: { include: { subject: true } },
            classSection: { include: { grade: true } },
          },
          orderBy: { lessonDate: "desc" },
          take: 100,
        }),
        prisma.user.findMany({ where: { schoolId, role: "TEACHER", isActive: true }, orderBy: { name: "asc" } }),
        prisma.classSection.findMany({
          where: { schoolId },
          include: { grade: true },
          orderBy: { name: "asc" },
        }),
        prisma.inspectionVisit.findMany({
          where: { schoolId, scheduledDate: { gte: new Date() } },
          include: { teacher: true, classSection: { include: { grade: true } } },
          orderBy: { scheduledDate: "asc" },
        }),
      ])
    : [[], [], [], []];

  return (
    <AppShell userName={user.name} role={user.role} isManagement>
      <main className="p-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>

        <section className="mt-6">
          <h2 className="font-medium">{t("teacherReportsTitle")}</h2>
          <div className="mt-3 flex flex-col gap-3">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                <span className="text-sm font-medium">{teacher.name}</span>
                <TeacherReportButton teacherId={teacher.id} />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-medium">{t("inspectionVisitsTitle")}</h2>
          <div className="mt-3">
            <InspectionVisitForm
              classSections={classSections.map((c) => ({ id: c.id, label: `${c.grade.name} · ${c.name}` }))}
            />
          </div>
          {upcomingVisits.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {upcomingVisits.map((v) => (
                <li key={v.id} className="rounded-md bg-slate-50 p-2">
                  {v.classSection.grade.name} · {v.classSection.name} — {v.teacher.name} —{" "}
                  {v.scheduledDate.toISOString().slice(0, 10)}
                  {v.notes && <span className="text-slate-500"> — {v.notes}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-medium">{t("allLessonPlansTitle")}</h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("teacher")}</th>
                  <th className="px-4 py-2 font-medium">{t("lesson")}</th>
                  <th className="px-4 py-2 font-medium">{t("classSection")}</th>
                  <th className="px-4 py-2 font-medium">{t("date")}</th>
                  <th className="px-4 py-2 font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {lessonPlans.map((lp) => (
                  <tr key={lp.id} className="border-b border-slate-100">
                    <td className="px-4 py-2">{lp.teacher.name}</td>
                    <td className="px-4 py-2">
                      <Link href={`/lesson-plans/${lp.id}`} className="hover:underline">
                        {lp.curriculumContent.lessonTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {lp.classSection.grade.name} · {lp.classSection.name}
                    </td>
                    <td className="px-4 py-2" dir="ltr">
                      {lp.lessonDate.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-2">{lp.status}</td>
                  </tr>
                ))}
                {lessonPlans.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      {t("noLessonPlans")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
