import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainNav } from "@/components/layout/MainNav";
import { CreateAssessmentForm } from "@/components/assessment/CreateAssessmentForm";

export default async function NewAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ lessonPlanId?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const { lessonPlanId } = await searchParams;

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
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <MainNav role={user.role} />
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">New Assessment</h1>
        <p className="mt-1 text-sm text-slate-500">
          Linked to lesson: {lessonPlan.curriculumContent.lessonTitle}
        </p>
        <div className="mt-6">
          <CreateAssessmentForm
            lessonPlanId={lessonPlan.id}
            defaultTitle={`${lessonPlan.curriculumContent.lessonTitle} — Assessment`}
          />
        </div>
      </main>
    </div>
  );
}
