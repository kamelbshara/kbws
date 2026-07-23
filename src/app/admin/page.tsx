import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminHomePage() {
  const session = await auth();
  const user = session!.user;

  const [school, academicYear, userCount, classSectionCount, timetableCount] = await Promise.all([
    prisma.school.findFirst(),
    prisma.academicYear.findFirst({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.classSection.count(),
    prisma.timetable.count(),
  ]);

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <AdminNav role={user.role} />
      <main className="p-6">
        <h1 className="text-xl font-semibold">
          {school?.name} <span className="text-slate-400">·</span> {academicYear?.name}
        </h1>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Users</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{userCount}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Class Sections</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{classSectionCount}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Timetable Slots</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{timetableCount}</CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
