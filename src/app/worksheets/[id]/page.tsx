import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { WorksheetEditor } from "@/components/worksheet/WorksheetEditor";
import { WorksheetContentSchema } from "@/lib/ai/worksheetSchema";

export default async function WorksheetPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session!.user;
  const { id } = await params;
  const t = await getTranslations("worksheet");

  const worksheet = await prisma.worksheet.findUnique({
    where: { id },
    include: {
      lessonPlan: {
        include: {
          curriculumContent: true,
        },
      },
    },
  });

  if (!worksheet || worksheet.createdById !== user.id) {
    notFound();
  }

  const contentParse = WorksheetContentSchema.safeParse(worksheet.contentJson);
  if (!contentParse.success) {
    notFound();
  }

  return (
    <AppShell userName={user.name} role={user.role}>
      <main className="mx-auto max-w-3xl p-6">
        <Link href={`/lesson-plans/${worksheet.lessonPlanId}`} className="text-sm text-slate-500 hover:underline">
          {t("backToLessonPlan")}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{worksheet.lessonPlan.curriculumContent.lessonTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>

        <div className="mt-6">
          <WorksheetEditor worksheetId={worksheet.id} initialContent={contentParse.data} />
        </div>
      </main>
    </AppShell>
  );
}
