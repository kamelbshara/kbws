import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateAssessmentForm } from "@/components/assessment/CreateAssessmentForm";
import { AppShell } from "@/components/layout/AppShell";

export default async function NewAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ lessonPlanId?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const { lessonPlanId } = await searchParams;
  const t = await getTranslations("assessments");

  if (!lessonPlanId) {
    notFound();
  }

  const lessonPlan = await prisma.lessonPlan.findUnique({
    where: { id: lessonPlanId },
    include: { curriculumContent: true },
  });

  if (!lessonPlan || lessonPlan.teacherId !== user.id) {
    notFound();
  }

  return (
      <AppShell userName={user.name} role={user.role}>
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">{t("newAssessment")}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("linkedToLesson", { title: lessonPlan.curriculumContent.lessonTitle })}
        </p>
        <div className="mt-6">
          <CreateAssessmentForm
            lessonPlanId={lessonPlan.id}
            defaultTitle={`${lessonPlan.curriculumContent.lessonTitle} — Assessment`}
          />
        </div>
      </main>
    </AppShell>
  );
}
