import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { LessonPlanForm } from "@/components/lesson-plan/LessonPlanForm";

export default async function NewLessonPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ timetableId?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const { timetableId } = await searchParams;
  const t = await getTranslations("lessonPlan");

  if (!timetableId) {
    notFound();
  }

  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    include: { subject: true, classSection: { include: { grade: true } } },
  });

  if (!timetable || timetable.teacherId !== user.id) {
    notFound();
  }

  const outcomes = await prisma.learningOutcome.findMany({
    where: {
      curriculumContent: {
        schoolId: timetable.schoolId,
        subjectId: timetable.subjectId,
        gradeId: timetable.classSection.gradeId,
        track: timetable.classSection.track,
      },
    },
    include: { curriculumContent: true },
    orderBy: { curriculumContent: { orderIndex: "asc" } },
  });

  return (
      <AppShell userName={user.name} role={user.role}>
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold">{t("newTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {timetable.subject.name} · {timetable.classSection.grade.name} · {timetable.classSection.name}
        </p>
        <div className="mt-6">
          {outcomes.length > 0 ? (
            <LessonPlanForm
              timetableId={timetable.id}
              outcomes={outcomes.map((o) => ({
                id: o.id,
                lessonTitle: o.curriculumContent.lessonTitle,
                unitTitle: o.curriculumContent.unitTitle,
                textEn: o.textEn,
                textAr: o.textAr,
              }))}
            />
          ) : (
            <p className="text-sm text-slate-600">{t("noCurriculumContent")}</p>
          )}
        </div>
      </main>
    </AppShell>
  );
}
