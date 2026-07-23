import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { CreateSchoolForm } from "@/components/admin/CreateSchoolForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_ROLES } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";

export default async function AdminSchoolsPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("schoolsPage");

  // Deliberately checked against the static ADMIN_ROLES constant, same
  // rationale as /admin/permissions: registering a new tenant is a
  // platform-level action, not something to make admin-configurable.
  if (!ADMIN_ROLES.includes(user.role)) {
    redirect("/admin");
  }

  const [schools, activeSchoolId] = await Promise.all([
    prisma.school.findMany({
      include: { _count: { select: { users: true, classSections: true, initiatives: true } } },
      orderBy: { createdAt: "asc" },
    }),
    getActiveSchoolId(session!),
  ]);

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <AdminNav role={user.role} />
      <main className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">{t("name")}</th>
                <th className="px-4 py-2 font-medium">{t("nameArabic")}</th>
                <th className="px-4 py-2 font-medium">{t("users")}</th>
                <th className="px-4 py-2 font-medium">{t("classSections")}</th>
                <th className="px-4 py-2 font-medium">{t("initiatives")}</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 font-medium">
                    {s.name}
                    {s.id === activeSchoolId && <span className="ml-2 text-xs text-slate-400">{t("active")}</span>}
                  </td>
                  <td className="px-4 py-2 text-slate-600" dir="rtl">
                    {s.nameAr}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{s._count.users}</td>
                  <td className="px-4 py-2 text-slate-600">{s._count.classSections}</td>
                  <td className="px-4 py-2 text-slate-600">{s._count.initiatives}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("createTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateSchoolForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
