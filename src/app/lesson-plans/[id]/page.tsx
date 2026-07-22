import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { LessonPlanEditor } from "@/components/lesson-plan/LessonPlanEditor";
import { LessonPlanContentSchema } from "@/lib/ai/lessonPlanSchema";

export default async function LessonPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session!.user;
  const { id } = await params;

  const lessonPlan = await prisma.lessonPlan.findUnique({
    where: { id },
    include: {
      classSection: { include: { grade: true } },
      curriculumContent: { include: { subject: true } },
      learningOutcome: true,
    },
  });

  if (!lessonPlan || lessonPlan.teacherId !== user.id) {
    notFound();
  }

  const contentParse = lessonPlan.contentJson ? LessonPlanContentSchema.safeParse(lessonPlan.contentJson) : null;
  const initialContent = contentParse?.success ? contentParse.data : null;

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">{lessonPlan.curriculumContent.lessonTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {lessonPlan.curriculumContent.subject.name} · {lessonPlan.classSection.grade.name} ·{" "}
          {lessonPlan.classSection.name} · {lessonPlan.lessonDate.toISOString().slice(0, 10)} ·{" "}
          {lessonPlan.durationMinutes} min
        </p>
        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm" dir="rtl">
          {lessonPlan.outcomeOverrideText || lessonPlan.learningOutcome.textAr}
        </div>
        <div className="mt-2 text-sm text-slate-700">
          <strong>Teacher prompt:</strong> {lessonPlan.teacherPrompt}
        </div>

        <div className="mt-6">
          <LessonPlanEditor
            lessonPlanId={lessonPlan.id}
            initialContent={initialContent}
            isPrinted={lessonPlan.status === "PRINTED"}
          />
        </div>
      </main>
    </div>
  );
}
