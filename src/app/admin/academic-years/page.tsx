import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { CreateAcademicYearForm } from "@/components/admin/CreateAcademicYearForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveSchoolId } from "@/lib/activeSchool";

export default async function AdminAcademicYearsPage() {
  const session = await auth();
  const user = session!.user;
  const schoolId = await getActiveSchoolId(session!);

  const years = schoolId
    ? await prisma.academicYear.findMany({ where: { schoolId }, orderBy: { startDate: "desc" } })
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
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Start</th>
                <th className="px-4 py-2 font-medium">End</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y) => (
                <tr key={y.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 font-medium">{y.name}</td>
                  <td className="px-4 py-2 text-slate-600" dir="ltr">
                    {y.startDate.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-2 text-slate-600" dir="ltr">
                    {y.endDate.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={y.isActive ? "text-green-700" : "text-slate-400"}>
                      {y.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {years.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No academic years yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create Academic Year</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateAcademicYearForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
