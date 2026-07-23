import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { CurriculumImportForm } from "@/components/admin/CurriculumImportForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveSchoolId } from "@/lib/activeSchool";

export default async function AdminCurriculumPage() {
  const session = await auth();
  const user = session!.user;
  const schoolId = await getActiveSchoolId(session!);

  const content = schoolId
    ? await prisma.curriculumContent.findMany({
        where: { schoolId },
        include: { subject: true, grade: true, learningOutcomes: true },
        orderBy: [{ subject: { name: "asc" } }, { grade: { level: "asc" } }, { orderIndex: "asc" }],
      })
    : [];

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <AdminNav role={user.role} />
      <main className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Subject</th>
                <th className="px-4 py-2 font-medium">Grade</th>
                <th className="px-4 py-2 font-medium">Unit</th>
                <th className="px-4 py-2 font-medium">Lesson</th>
                <th className="px-4 py-2 font-medium">Outcomes</th>
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
                    No curriculum content yet. Import a CSV to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Import Curriculum</CardTitle>
          </CardHeader>
          <CardContent>
            <CurriculumImportForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
