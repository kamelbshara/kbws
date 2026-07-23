import Link from "next/link";
import { notFound } from "next/navigation";
import { diffWords } from "diff";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { LessonPlanContentSchema } from "@/lib/ai/lessonPlanSchema";
import { flattenLessonPlanContent, LESSON_PLAN_FIELD_KEYS } from "@/lib/lessonPlanDiff";
import type { LessonPlanContent } from "@/lib/ai/lessonPlanSchema";

async function resolveSide(
  lessonPlanId: string,
  side: string | undefined,
  currentDraftLabel: string,
): Promise<{ label: string; content: LessonPlanContent | null } | null> {
  if (!side) return null;
  if (side === "current") {
    const lessonPlan = await prisma.lessonPlan.findUnique({ where: { id: lessonPlanId } });
    if (!lessonPlan) return null;
    const parsed = lessonPlan.contentJson ? LessonPlanContentSchema.safeParse(lessonPlan.contentJson) : null;
    return { label: currentDraftLabel, content: parsed?.success ? parsed.data : null };
  }
  const versionNumber = Number(side);
  if (!Number.isInteger(versionNumber)) return null;
  const version = await prisma.lessonPlanVersion.findUnique({
    where: { lessonPlanId_versionNumber: { lessonPlanId, versionNumber } },
  });
  if (!version) return null;
  const parsed = LessonPlanContentSchema.safeParse(version.contentJson);
  return { label: `v${versionNumber}`, content: parsed.success ? parsed.data : null };
}

export default async function LessonPlanVersionComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const { id } = await params;
  const { a, b } = await searchParams;
  const t = await getTranslations("lessonPlanVersions");
  const tFields = await getTranslations("lessonPlanFields");

  const lessonPlan = await prisma.lessonPlan.findUnique({ where: { id }, include: { curriculumContent: true } });
  if (!lessonPlan || lessonPlan.teacherId !== user.id) {
    notFound();
  }

  const [sideA, sideB] = await Promise.all([
    resolveSide(id, a, t("currentDraft")),
    resolveSide(id, b, t("currentDraft")),
  ]);
  if (!sideA || !sideB || !sideA.content || !sideB.content) {
    notFound();
  }

  const fieldsA = flattenLessonPlanContent(sideA.content);
  const fieldsB = flattenLessonPlanContent(sideB.content);

  return (
      <AppShell userName={user.name} role={user.role}>
      <main className="mx-auto max-w-4xl p-6">
        <Link href={`/lesson-plans/${lessonPlan.id}/versions`} className="text-sm text-slate-500 hover:underline">
          {t("backToVersionHistory")}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{lessonPlan.curriculumContent.lessonTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("comparing", { a: sideA.label, b: sideB.label })}</p>
        <p className="mt-1 text-xs text-slate-400">
          <span className="bg-red-100 text-red-700 line-through">{t("removedLabel")}</span> ·{" "}
          <span className="bg-green-100 text-green-700">{t("addedLabel")}</span>
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {LESSON_PLAN_FIELD_KEYS.map((key) => {
            const textA = fieldsA.find((f) => f.key === key)?.text ?? "";
            const textB = fieldsB.find((f) => f.key === key)?.text ?? "";
            if (textA === textB) {
              return (
                <div key={key} className="rounded-md border border-slate-200 p-4">
                  <h2 className="text-sm font-medium text-slate-500">{tFields(key)}</h2>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{textA || "—"}</p>
                </div>
              );
            }
            const parts = diffWords(textA, textB);
            return (
              <div key={key} className="rounded-md border border-amber-300 bg-amber-50/40 p-4">
                <h2 className="text-sm font-medium text-slate-700">{tFields(key)}</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {parts.map((part, i) => (
                    <span
                      key={i}
                      className={
                        part.added
                          ? "bg-green-100 text-green-800"
                          : part.removed
                            ? "bg-red-100 text-red-700 line-through"
                            : undefined
                      }
                    >
                      {part.value}
                    </span>
                  ))}
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
