import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { CreateTimetableSlotForm } from "@/components/admin/CreateTimetableSlotForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminTimetablePage() {
  const session = await auth();
  const user = session!.user;

  const [slots, teachers, classSections, subjects] = await Promise.all([
    prisma.timetable.findMany({
      include: { teacher: true, classSection: true, subject: true },
      orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
    }),
    prisma.user.findMany({ where: { role: "TEACHER" }, orderBy: { name: "asc" } }),
    prisma.classSection.findMany({ include: { grade: true }, orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
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
                <th className="px-4 py-2 font-medium">Day</th>
                <th className="px-4 py-2 font-medium">Period</th>
                <th className="px-4 py-2 font-medium">Teacher</th>
                <th className="px-4 py-2 font-medium">Class</th>
                <th className="px-4 py-2 font-medium">Subject</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">{s.dayOfWeek}</td>
                  <td className="px-4 py-2">{s.periodNumber}</td>
                  <td className="px-4 py-2">{s.teacher.name}</td>
                  <td className="px-4 py-2">{s.classSection.name}</td>
                  <td className="px-4 py-2">{s.subject.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create Timetable Slot</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateTimetableSlotForm
              teachers={teachers.map((t) => ({ id: t.id, label: t.name }))}
              classSections={classSections.map((c) => ({ id: c.id, label: `${c.grade.name} - ${c.name}` }))}
              subjects={subjects.map((s) => ({ id: s.id, label: s.name }))}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
