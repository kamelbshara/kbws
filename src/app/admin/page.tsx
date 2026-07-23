import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { AppShell } from "@/components/layout/AppShell";

export default async function AdminHomePage() {
  const session = await auth();
  const user = session!.user;
  const schoolId = await getActiveSchoolId(session!);
  const t = await getTranslations("adminOverview");

  const [school, academicYear, userCount, classSectionCount, timetableCount] = await Promise.all([
    schoolId ? prisma.school.findUnique({ where: { id: schoolId } }) : Promise.resolve(null),
    schoolId ? prisma.academicYear.findFirst({ where: { schoolId, isActive: true } }) : Promise.resolve(null),
    schoolId ? prisma.user.count({ where: { schoolId } }) : Promise.resolve(0),
    schoolId ? prisma.classSection.count({ where: { schoolId } }) : Promise.resolve(0),
    schoolId ? prisma.timetable.count({ where: { schoolId } }) : Promise.resolve(0),
  ]);

  return (
      <AppShell userName={user.name} role={user.role} isManagement>
      <main className="p-6">
        <h1 className="text-xl font-semibold">
          {school?.name} <span className="text-slate-400">·</span> {academicYear?.name}
        </h1>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{t("users")}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{userCount}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{t("classSections")}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{classSectionCount}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{t("timetableSlots")}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{timetableCount}</CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}
