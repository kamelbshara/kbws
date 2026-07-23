import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";

export default async function AssessmentsListPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("assessments");

  const assessments = await prisma.assessment.findMany({
    where: { teacherId: user.id },
    include: {
      lessonPlan: { include: { curriculumContent: true, classSection: { include: { grade: true } } } },
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
      <AppShell userName={user.name} role={user.role}>
      <main className="p-6">
        <h1 className="text-xl font-semibold">{t("myAssessments")}</h1>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">{t("titleHeader")}</th>
                <th className="px-4 py-2 font-medium">{t("lessonHeader")}</th>
                <th className="px-4 py-2 font-medium">{t("classHeader")}</th>
                <th className="px-4 py-2 font-medium">{t("questionsHeader")}</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/assessments/${a.id}`} className="font-medium hover:underline">
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{a.lessonPlan?.curriculumContent.lessonTitle ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {a.lessonPlan ? `${a.lessonPlan.classSection.grade.name} · ${a.lessonPlan.classSection.name}` : "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{a._count.questions}</td>
                </tr>
              ))}
              {assessments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </AppShell>
  );
}
