import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainNav } from "@/components/layout/MainNav";
import { InitiativeEditor } from "@/components/initiative/InitiativeEditor";
import { EvidenceSection } from "@/components/initiative/EvidenceSection";
import { MANAGEMENT_ROLES } from "@/lib/permissions";
import { INITIATIVE_CATEGORY_LABELS, INITIATIVE_STATUS_LABELS } from "@/lib/initiativeLabels";
import type { InitiativeGeneration } from "@/lib/ai/initiativeSchema";

export default async function InitiativeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session!.user;
  const { id } = await params;

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      phases: { orderBy: { orderIndex: "asc" } },
      indicators: true,
      evidence: { include: { createdBy: true }, orderBy: { createdAt: "desc" } },
      owner: true,
    },
  });

  const isManagement = MANAGEMENT_ROLES.includes(user.role);
  if (!initiative || (initiative.ownerId !== user.id && !isManagement)) {
    notFound();
  }

  const initialContent: InitiativeGeneration | null = initiative.goal
    ? {
        goal: initiative.goal,
        targetGroup: initiative.targetGroup ?? "",
        phases: initiative.phases.map((p) => ({ name: p.name, description: p.description, timeline: p.timeline ?? "" })),
        indicators: initiative.indicators.map((i) => ({
          name: i.name,
          measurementMethod: i.measurementMethod,
          targetValue: i.targetValue ?? "",
        })),
      }
    : null;

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <MainNav role={user.role} />
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">{initiative.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {INITIATIVE_CATEGORY_LABELS[initiative.category]} · {INITIATIVE_STATUS_LABELS[initiative.status]} ·{" "}
          {initiative.owner.name}
        </p>
        <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <strong>Initial idea:</strong> {initiative.initialIdea}
        </div>

        <div className="mt-6">
          <InitiativeEditor initiativeId={initiative.id} initialContent={initialContent} status={initiative.status} />
        </div>

        <div className="mt-6">
          <EvidenceSection
            initiativeId={initiative.id}
            evidence={initiative.evidence.map((e) => ({
              id: e.id,
              description: e.description,
              link: e.link,
              createdAt: e.createdAt.toISOString().slice(0, 10),
              createdBy: { name: e.createdBy.name },
            }))}
          />
        </div>
      </main>
    </div>
  );
}
