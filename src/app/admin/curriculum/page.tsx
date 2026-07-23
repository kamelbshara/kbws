import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CurriculumImportForm } from "@/components/admin/CurriculumImportForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { AppShell } from "@/components/layout/AppShell";

export default async function AdminCurriculumPage() {
  const session = await auth();
  const user = session!.user;
  const schoolId = await getActiveSchoolId(session!);
  const t = await getTranslations("curriculumPage");

  const content = schoolId
    ? await prisma.curriculumContent.findMany({
        where: { schoolId },
        include: { subject: true, grade: true, learningOutcomes: true },
        orderBy: [{ subject: { name: "asc" } }, { grade: { level: "asc" } }, { orderIndex: "asc" }],
      })
    : [];

  return (
      <AppShell userName={user.name} role={user.role} isManagement>
      <main className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">{t("subject")}</th>
                <th className="px-4 py-2 font-medium">{t("grade")}</th>
                <th className="px-4 py-2 font-medium">{t("unit")}</th>
                <th className="px-4 py-2 font-medium">{t("lesson")}</th>
                <th className="px-4 py-2 font-medium">{t("outcomes")}</th>
              </tr>
            </thead>
            <tbody>
              {content.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{c.subject.name}</td>
                  <td className="px-4 py-2 text-slate-600">{c.grade.name}</td>
                  <td className="px-4 py-2 text-slate-600">{c.unitTitle}</td>
                  <td className="px-4 py-2">{c.lessonTitle}</td>
                  <td className="px-4 py-2 text-slate-600">{c.learningOutcomes.length}</td>
                </tr>
              ))}
              {content.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("importTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CurriculumImportForm />
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
