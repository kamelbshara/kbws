import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";

export default async function LessonPlanVersionsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session!.user;
  const { id } = await params;

  const lessonPlan = await prisma.lessonPlan.findUnique({
    where: { id },
    include: {
      curriculumContent: true,
      versions: { include: { printedBy: true }, orderBy: { versionNumber: "desc" } },
    },
  });

  if (!lessonPlan || lessonPlan.teacherId !== user.id) {
    notFound();
  }

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <main className="mx-auto max-w-2xl p-6">
        <Link href={`/lesson-plans/${lessonPlan.id}`} className="text-sm text-slate-500 hover:underline">
          ← Back to lesson plan
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Version History</h1>
        <p className="mt-1 text-sm text-slate-500">{lessonPlan.curriculumContent.lessonTitle}</p>

        {lessonPlan.versions.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            No printed versions yet. Versions are created automatically each time this lesson plan is printed.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Version</th>
                  <th className="px-4 py-2 font-medium">Printed</th>
                  <th className="px-4 py-2 font-medium">Printed By</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {lessonPlan.versions.map((v, index) => (
                  <tr key={v.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 font-medium">v{v.versionNumber}</td>
                    <td className="px-4 py-2 text-slate-600" dir="ltr">
                      {v.printedAt.toISOString().replace("T", " ").slice(0, 16)}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{v.printedBy.name}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/lesson-plans/${lessonPlan.id}/versions/${v.versionNumber}`}>View</Link>
                        </Button>
                        {index < lessonPlan.versions.length - 1 && (
                          <Button asChild variant="ghost" size="sm">
                            <Link
                              href={`/lesson-plans/${lessonPlan.id}/versions/compare?a=${lessonPlan.versions[index + 1].versionNumber}&b=${v.versionNumber}`}
                            >
                              Compare to previous
                            </Link>
                          </Button>
                        )}
                        {index === 0 && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/lesson-plans/${lessonPlan.id}/versions/compare?a=${v.versionNumber}&b=current`}>
                              Compare to current draft
                            </Link>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
