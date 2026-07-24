import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { LessonPlanTemplateForm } from "@/components/admin/LessonPlanTemplateForm";
import { getActiveSchoolId } from "@/lib/activeSchool";

export default async function LessonPlanTemplatePage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("lessonPlanTemplatePage");
  const schoolId = await getActiveSchoolId(session!);

  const activeTemplate = schoolId
    ? await prisma.lessonPlanTemplate.findFirst({
        where: { schoolId, isActive: true },
        orderBy: { createdAt: "desc" },
      })
    : null;

  return (
    <AppShell userName={user.name} role={user.role} isManagement>
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>

        {activeTemplate && (
          <div className="mt-4 rounded-md border border-brand-gold/30 bg-brand-cream/40 p-4 text-sm">
            <div className="font-medium">{t("currentTemplate")}: {activeTemplate.title}</div>
            {activeTemplate.fileUrl && (
              <a href={activeTemplate.fileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block underline">
                {activeTemplate.fileName ?? t("viewFile")}
              </a>
            )}
          </div>
        )}

        <div className="mt-6">
          <LessonPlanTemplateForm />
        </div>
      </main>
    </AppShell>
  );
}
