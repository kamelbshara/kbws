import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { KNOWLEDGE_MODULES } from "@/lib/knowledgeMemory";
import { CreateKnowledgeMemoryForm } from "@/components/knowledge/CreateKnowledgeMemoryForm";
import { KnowledgeMemoryList } from "@/components/knowledge/KnowledgeMemoryList";
import { AppShell } from "@/components/layout/AppShell";

export default async function KnowledgeMemoryPage() {
  const session = await auth();
  const user = session!.user;

  if (user.role !== "SYSTEM_ADMIN") {
    redirect("/");
  }
  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role);

  const t = await getTranslations("knowledgeMemory");
  const schoolId = await getActiveSchoolId(session!);

  const [subjects, grades, items] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.grade.findMany({ orderBy: { level: "asc" } }),
    schoolId
      ? prisma.knowledgeMemoryItem.findMany({
          where: { schoolId },
          include: { subject: true, grade: true, createdBy: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
      <AppShell userName={user.name} role={user.role} isManagement={isManagement}>
      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-6 p-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>

          <KnowledgeMemoryList
            currentUserId={user.id}
            items={items.map((i) => ({
              id: i.id,
              module: i.module,
              subjectName: i.subject?.name ?? null,
              gradeName: i.grade?.name ?? null,
              title: i.title,
              content: i.content,
              createdByName: i.createdBy.name,
              createdById: i.createdById,
              createdAt: i.createdAt.toISOString().slice(0, 10),
            }))}
          />
        </div>

        <div>
          <CreateKnowledgeMemoryForm
            modules={KNOWLEDGE_MODULES}
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
            grades={grades.map((g) => ({ id: g.id, name: g.name }))}
          />
        </div>
      </main>
    </AppShell>
  );
}
