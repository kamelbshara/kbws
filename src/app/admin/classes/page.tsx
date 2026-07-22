import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { CreateClassSectionForm } from "@/components/admin/CreateClassSectionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminClassesPage() {
  const session = await auth();
  const user = session!.user;

  const [classSections, grades] = await Promise.all([
    prisma.classSection.findMany({
      include: { grade: true },
      orderBy: [{ grade: { level: "asc" } }, { name: "asc" }],
    }),
    prisma.grade.findMany({ orderBy: { level: "asc" } }),
  ]);

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <AdminNav />
      <main className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Grade</th>
                <th className="px-4 py-2 font-medium">Track</th>
                <th className="px-4 py-2 font-medium">Section</th>
              </tr>
            </thead>
            <tbody>
              {classSections.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{c.grade.name}</td>
                  <td className="px-4 py-2 text-slate-600">{c.track ?? "—"}</td>
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create Class Section</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateClassSectionForm grades={grades} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
