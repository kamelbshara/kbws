import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { toggleUserActiveAction } from "@/actions/school-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { AppShell } from "@/components/layout/AppShell";

export default async function AdminUsersPage() {
  const session = await auth();
  const user = session!.user;
  const schoolId = await getActiveSchoolId(session!);
  const t = await getTranslations("usersPage");

  const users = schoolId ? await prisma.user.findMany({ where: { schoolId }, orderBy: { createdAt: "asc" } }) : [];

  return (
      <AppShell userName={user.name} role={user.role} isManagement>
      <main className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">{t("name")}</th>
                <th className="px-4 py-2 font-medium">{t("email")}</th>
                <th className="px-4 py-2 font-medium">{t("role")}</th>
                <th className="px-4 py-2 font-medium">{t("status")}</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2">{t(`roles.${u.role}`)}</td>
                  <td className="px-4 py-2">
                    <span className={u.isActive ? "text-green-700" : "text-slate-400"}>
                      {u.isActive ? t("active") : t("suspended")}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <form action={toggleUserActiveAction.bind(null, u.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        {u.isActive ? t("suspend") : t("reactivate")}
                      </Button>
                    </form>
                  </td>
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
            <CreateUserForm />
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
