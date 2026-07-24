import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InitiativeEditor } from "@/components/initiative/InitiativeEditor";
import { EvidenceSection } from "@/components/initiative/EvidenceSection";
import { InitiativeCommentsSection } from "@/components/initiative/InitiativeCommentsSection";
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
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      owner: true,
      assignedTo: true,
    },
  });

  const isOwner = initiative?.ownerId === user.id;
  const isAssignee = initiative?.assignedToId === user.id;
  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role);
  const schoolId = await getActiveSchoolId(session!);
  const isManagementForThisSchool = isManagement && initiative?.schoolId === schoolId;
  if (!initiative || (!isOwner && !isAssignee && !isManagementForThisSchool)) {
    notFound();
  }

  const canEdit = isOwner || isAssignee;

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
          phaseIndex: i.phaseId ? initiative.phases.findIndex((p) => p.id === i.phaseId) : undefined,
          aiAnalysis:
            i.aiAnalysis && typeof i.aiAnalysis === "object" && "text" in i.aiAnalysis
              ? String((i.aiAnalysis as { text: unknown }).text)
              : "",
        })),
      }
    : null;

  return (
      <AppShell userName={user.name} role={user.role} isManagement={isManagementForThisSchool}>
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">{initiative.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t(`categories.${initiative.category}`)} · {t(`statuses.${initiative.status}`)} · {initiative.owner.name}
          {initiative.assignedTo && ` → ${initiative.assignedTo.name}`}
        </p>
        <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <strong>{t("initialIdeaLabel")}</strong> {initiative.initialIdea}
        </div>

        <div className="mt-6">
          <InitiativeEditor
            initiativeId={initiative.id}
            initialContent={initialContent}
            initialReflection={initiative.reflection}
            status={initiative.status}
            updatedAt={initiative.updatedAt.toISOString()}
            canEdit={canEdit}
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
            canEdit={canEdit}
          />
        </div>

        <div className="mt-6">
          <InitiativeCommentsSection
            initiativeId={initiative.id}
            comments={initiative.comments.map((c) => ({
              id: c.id,
              body: c.body,
              authorName: c.author.name,
              createdAt: c.createdAt.toISOString().slice(0, 10),
            }))}
          />
        </div>
      </main>
    </AppShell>
  );
}
