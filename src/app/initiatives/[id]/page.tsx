import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InitiativeEditor } from "@/components/initiative/InitiativeEditor";
import { EvidenceSection } from "@/components/initiative/EvidenceSection";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import type { InitiativeSave } from "@/lib/ai/initiativeSchema";
import { AppShell } from "@/components/layout/AppShell";

export default async function InitiativeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session!.user;
  const { id } = await params;
  const t = await getTranslations("initiatives");

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      phases: { orderBy: { orderIndex: "asc" } },
      indicators: true,
      evidence: { include: { createdBy: true }, orderBy: { createdAt: "desc" } },
      owner: true,
    },
  });

  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role);
  const schoolId = await getActiveSchoolId(session!);
  const isManagementForThisSchool = isManagement && initiative?.schoolId === schoolId;
  if (!initiative || (initiative.ownerId !== user.id && !isManagementForThisSchool)) {
    notFound();
  }

  const initialContent: InitiativeSave | null = initiative.goal
    ? {
        goal: initiative.goal,
        targetGroup: initiative.targetGroup ?? "",
        phases: initiative.phases.map((p) => ({ name: p.name, description: p.description, timeline: p.timeline ?? "" })),
        indicators: initiative.indicators.map((i) => ({
          name: i.name,
          measurementMethod: i.measurementMethod,
          baselineValue: i.baselineValue ?? "",
          targetValue: i.targetValue ?? "",
          actualValue: i.actualValue ?? "",
        })),
      }
    : null;

  return (
      <AppShell userName={user.name} role={user.role}>
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">{initiative.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t(`categories.${initiative.category}`)} · {t(`statuses.${initiative.status}`)} · {initiative.owner.name}
        </p>
        <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <strong>{t("initialIdeaLabel")}</strong> {initiative.initialIdea}
        </div>

        <div className="mt-6">
          <InitiativeEditor
            initiativeId={initiative.id}
            initialContent={initialContent}
            status={initiative.status}
            updatedAt={initiative.updatedAt.toISOString()}
          />
        </div>

        <div className="mt-6">
          <EvidenceSection
            initiativeId={initiative.id}
            evidence={initiative.evidence.map((e) => ({
              id: e.id,
              description: e.description,
              link: e.link,
              fileUrl: e.fileUrl,
              fileName: e.fileName,
              createdAt: e.createdAt.toISOString().slice(0, 10),
              createdBy: { name: e.createdBy.name },
            }))}
          />
        </div>
      </main>
    </AppShell>
  );
}
