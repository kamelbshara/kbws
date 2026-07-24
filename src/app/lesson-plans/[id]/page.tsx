import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { LessonPlanEditor } from "@/components/lesson-plan/LessonPlanEditor";
import { LessonPlanReadOnlyView } from "@/components/lesson-plan/LessonPlanReadOnlyView";
import { WorksheetSection } from "@/components/lesson-plan/WorksheetSection";
import { LessonPlanContentSchema } from "@/lib/ai/lessonPlanSchema";
import { Button } from "@/components/ui/button";
import { getRoleGroup } from "@/lib/permissions";

export default async function LessonPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session!.user;
  const { id } = await params;
  const t = await getTranslations("lessonPlan");

  const lessonPlan = await prisma.lessonPlan.findUnique({
    where: { id },
    include: {
      teacher: true,
      classSection: { include: { grade: true } },
      curriculumContent: { include: { subject: true } },
      learningOutcome: true,
      assessments: true,
      worksheets: { orderBy: { createdAt: "desc" } },
    },
  });

  const isOwner = lessonPlan?.teacherId === user.id;
  const managementRoles = await getRoleGroup("MANAGEMENT_ROLES");
  const isManagementViewer =
    !isOwner && managementRoles.includes(user.role) && lessonPlan?.teacher.schoolId === user.schoolId && user.schoolId != null;

  if (!lessonPlan || (!isOwner && !isManagementViewer)) {
    notFound();
  }

  const contentParse = lessonPlan.contentJson ? LessonPlanContentSchema.safeParse(lessonPlan.contentJson) : null;
  const initialContent = contentParse?.success ? contentParse.data : null;

  return (
      <AppShell userName={user.name} role={user.role} isManagement={isManagementViewer}>
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">{lessonPlan.curriculumContent.lessonTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isManagementViewer && `${lessonPlan.teacher.name} · `}
          {lessonPlan.curriculumContent.subject.name} · {lessonPlan.classSection.grade.name} ·{" "}
          {lessonPlan.classSection.name} · {lessonPlan.lessonDate.toISOString().slice(0, 10)} ·{" "}
          {lessonPlan.durationMinutes} min
        </p>
        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm" dir="rtl">
          {lessonPlan.outcomeOverrideText || lessonPlan.learningOutcome.textAr}
        </div>
        <div className="mt-2 text-sm text-slate-700">
          <strong>{t("teacherPromptShown")}</strong> {lessonPlan.teacherPrompt}
        </div>

        <div className="mt-6">
          {isOwner ? (
            <LessonPlanEditor
              lessonPlanId={lessonPlan.id}
              initialContent={initialContent}
              isPrinted={lessonPlan.status === "PRINTED"}
              updatedAt={lessonPlan.updatedAt.toISOString()}
            />
          ) : (
            <LessonPlanReadOnlyView content={initialContent} />
          )}
        </div>

        {lessonPlan.status === "PRINTED" && (
          <div className="mt-4">
            <Link href={`/lesson-plans/${lessonPlan.id}/versions`} className="text-sm text-slate-500 hover:underline">
              {t("viewVersionHistory")}
            </Link>
          </div>
        )}

        <div className="mt-6 rounded-md border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{t("assessmentsTitle")}</h2>
            {isOwner && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/assessments/new?lessonPlanId=${lessonPlan.id}`}>{t("newAssessment")}</Link>
              </Button>
            )}
          </div>
          {lessonPlan.assessments.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {lessonPlan.assessments.map((a) => (
                <li key={a.id}>
                  <Link href={`/assessments/${a.id}`} className="hover:underline">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">{t("noAssessmentsYet")}</p>
          )}
        </div>

        {isOwner && (
          <WorksheetSection
            lessonPlanId={lessonPlan.id}
            worksheets={lessonPlan.worksheets.map((w) => ({ id: w.id, createdAt: w.createdAt.toISOString().slice(0, 10) }))}
            canGenerate={initialContent !== null}
          />
        )}
      </main>
    </AppShell>
  );
}
