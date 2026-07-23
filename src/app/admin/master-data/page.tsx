import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_ROLES } from "@/lib/permissions";
import { CreateSubjectForm } from "@/components/admin/CreateSubjectForm";
import { CreateGradeForm } from "@/components/admin/CreateGradeForm";

export default async function MasterDataPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("masterDataPage");

  // Subjects and grades are shared across every school, so managing them is
  // deliberately a platform-level action, same rationale as /admin/schools.
  if (!ADMIN_ROLES.includes(user.role)) {
    redirect("/admin");
  }

  const [subjects, grades] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.grade.findMany({ orderBy: { level: "asc" } }),
  ]);

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <AdminNav role={user.role} />
      <main className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("subjectName")}</th>
                  <th className="px-4 py-2 font-medium">{t("subjectNameAr")}</th>
                  <th className="px-4 py-2 font-medium">{t("subjectCode")}</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-medium">{s.name}</td>
                    <td className="px-4 py-2 text-slate-600" dir="rtl">
                      {s.nameAr}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{s.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t("createSubjectTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateSubjectForm />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("gradeLevel")}</th>
                  <th className="px-4 py-2 font-medium">{t("gradeName")}</th>
                  <th className="px-4 py-2 font-medium">{t("gradeNameAr")}</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">{g.level}</td>
                    <td className="px-4 py-2 font-medium">{g.name}</td>
                    <td className="px-4 py-2 text-slate-600" dir="rtl">
                      {g.nameAr}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t("createGradeTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateGradeForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
