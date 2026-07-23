import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { LessonPlanContentSchema } from "@/lib/ai/lessonPlanSchema";
import { flattenLessonPlanContent } from "@/lib/lessonPlanDiff";

export default async function LessonPlanVersionPage({
  params,
}: {
  params: Promise<{ id: string; versionNumber: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const { id, versionNumber } = await params;
  const t = await getTranslations("lessonPlanVersions");
  const tFields = await getTranslations("lessonPlanFields");

  const lessonPlan = await prisma.lessonPlan.findUnique({
    where: { id },
    include: { curriculumContent: true },
  });
  if (!lessonPlan || lessonPlan.teacherId !== user.id) {
    notFound();
  }

  const version = await prisma.lessonPlanVersion.findUnique({
    where: { lessonPlanId_versionNumber: { lessonPlanId: id, versionNumber: Number(versionNumber) } },
    include: { printedBy: true },
  });
  if (!version) {
    notFound();
  }

  const contentParse = LessonPlanContentSchema.safeParse(version.contentJson);
  const fields = contentParse.success ? flattenLessonPlanContent(contentParse.data) : [];

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <main className="mx-auto max-w-3xl p-6">
        <Link href={`/lesson-plans/${lessonPlan.id}/versions`} className="text-sm text-slate-500 hover:underline">
          {t("backToVersionHistory")}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {lessonPlan.curriculumContent.lessonTitle} — v{version.versionNumber}
        </h1>
        <p className="mt-1 text-sm text-slate-500" dir="ltr">
          {t("printedByLine", {
            date: version.printedAt.toISOString().replace("T", " ").slice(0, 16),
            name: version.printedBy.name,
          })}
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {fields.map((f) => (
            <div key={f.key} className="rounded-md border border-slate-200 p-4">
              <h2 className="text-sm font-medium text-slate-500">{tFields(f.key)}</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{f.text}</p>
            </div>
          ))}
          {fields.length === 0 && <p className="text-sm text-red-600">{t("contentUnreadable")}</p>}
        </div>
      </main>
    </div>
  );
}
