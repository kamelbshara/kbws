import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainNav } from "@/components/layout/MainNav";
import { AssessmentEditor } from "@/components/assessment/AssessmentEditor";
import type { AssessmentGeneration } from "@/lib/ai/questionSchema";

export default async function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session!.user;
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      lessonPlan: { include: { curriculumContent: true, classSection: { include: { grade: true } } } },
      questions: { include: { question: true }, orderBy: { orderIndex: "asc" } },
    },
  });

  if (!assessment || assessment.teacherId !== user.id) {
    notFound();
  }

  const initialContent: AssessmentGeneration | null =
    assessment.questions.length > 0
      ? {
          questions: assessment.questions.map(({ question: q }) => ({
            type: q.type,
            difficulty: q.difficulty,
            skill: q.skill,
            questionText: q.questionText,
            choices: (q.choices as string[] | null) ?? undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation ?? "",
          })),
        }
      : null;

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <MainNav role={user.role} />
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">{assessment.title}</h1>
        {assessment.lessonPlan && (
          <p className="mt-1 text-sm text-slate-500">
            {assessment.lessonPlan.curriculumContent.lessonTitle} · {assessment.lessonPlan.classSection.grade.name} ·{" "}
            {assessment.lessonPlan.classSection.name}
          </p>
        )}

        <div className="mt-6">
          <AssessmentEditor assessmentId={assessment.id} initialContent={initialContent} />
        </div>
      </main>
    </div>
  );
}
