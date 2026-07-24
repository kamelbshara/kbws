import { prisma } from "@/lib/prisma";

/** Shared by the teacher's own "My Insights" generation and management's "Teacher Report" generation. */
export async function buildTeacherContext(teacherId: string): Promise<string> {
  const [lessonPlans, assessments, initiatives] = await Promise.all([
    prisma.lessonPlan.findMany({
      where: { teacherId },
      include: { curriculumContent: { include: { subject: true } }, classSection: { include: { grade: true } } },
      orderBy: { lessonDate: "desc" },
      take: 30,
    }),
    prisma.assessment.findMany({
      where: { teacherId },
      include: { questions: { include: { question: true } } },
    }),
    prisma.initiative.findMany({ where: { ownerId: teacherId }, select: { title: true, status: true } }),
  ]);

  const subjectGradeCombos = new Set(
    lessonPlans.map((lp) => `${lp.curriculumContent.subject.name} / ${lp.classSection.grade.name}`),
  );

  const allQuestions = assessments.flatMap((a) => a.questions.map((q) => q.question));
  const difficultyCounts: Record<string, number> = {};
  const skillCounts: Record<string, number> = {};
  for (const q of allQuestions) {
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] ?? 0) + 1;
    skillCounts[q.skill] = (skillCounts[q.skill] ?? 0) + 1;
  }

  return [
    `Total lesson plans created: ${lessonPlans.length} (printed: ${lessonPlans.filter((lp) => lp.status === "PRINTED").length})`,
    `Subject/grade combinations taught: ${[...subjectGradeCombos].join(", ") || "none"}`,
    `Recent lesson titles: ${lessonPlans.slice(0, 10).map((lp) => lp.curriculumContent.lessonTitle).join(", ") || "none"}`,
    `Total assessments created: ${assessments.length}, total questions: ${allQuestions.length}`,
    `Question difficulty distribution: ${Object.entries(difficultyCounts).map(([k, v]) => `${k}=${v}`).join(", ") || "none"}`,
    `Skills assessed: ${Object.entries(skillCounts).map(([k, v]) => `${k}=${v}`).join(", ") || "none"}`,
    `Initiatives owned: ${initiatives.map((i) => `${i.title} (${i.status})`).join(", ") || "none"}`,
  ].join("\n");
}
