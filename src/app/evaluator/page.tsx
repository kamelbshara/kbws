import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { AppShell } from "@/components/layout/AppShell";

function formatTimestamp(date: Date) {
  return date.toISOString().replace("T", " ").slice(0, 16);
}

type TimelineEvent = {
  date: Date;
  type:
    | "lessonPlanPrinted"
    | "initiativeCreated"
    | "initiativeCompleted"
    | "meetingHeld"
    | "assessmentCreated"
    | "insightGenerated";
  title: string;
  by: string;
};

export default async function EvaluatorPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("evaluatorPage");
  const tInit = await getTranslations("initiatives");
  const tAudit = await getTranslations("auditLogPage");
  const tImpact = await getTranslations("impactReport");

  if (!(await getRoleGroup("EVALUATOR_ROLES")).includes(user.role)) {
    redirect("/");
  }

  const schoolId = await getActiveSchoolId(session!);

  const [aiLogs, evidenceItems, initiativesWithIndicators, lessonPlanVersions, initiativesForTimeline, meetings, assessments, insights] =
    schoolId
      ? await Promise.all([
          prisma.aIGenerationLog.findMany({
            where: { user: { schoolId } },
            include: {
              user: true,
              lessonPlan: { include: { curriculumContent: true } },
              initiative: true,
              operationalPlan: true,
              assessment: true,
              insight: true,
              feedback: true,
            },
            orderBy: { createdAt: "desc" },
            take: 30,
          }),
          prisma.initiativeEvidence.findMany({
            where: { initiative: { schoolId } },
            include: { initiative: true, createdBy: true },
            orderBy: { createdAt: "desc" },
            take: 30,
          }),
          prisma.initiative.findMany({
            where: { schoolId, indicators: { some: {} } },
            include: { indicators: true, owner: true },
            orderBy: { createdAt: "desc" },
          }),
          prisma.lessonPlanVersion.findMany({
            where: { lessonPlan: { teacher: { schoolId } } },
            include: { lessonPlan: { include: { curriculumContent: true } }, printedBy: true },
            orderBy: { printedAt: "desc" },
            take: 40,
          }),
          prisma.initiative.findMany({
            where: { schoolId },
            include: { owner: true },
            orderBy: { createdAt: "desc" },
            take: 40,
          }),
          prisma.meeting.findMany({
            where: { team: { schoolId } },
            include: { team: true, createdBy: true },
            orderBy: { date: "desc" },
            take: 40,
          }),
          prisma.assessment.findMany({
            where: { teacher: { schoolId } },
            include: { teacher: true },
            orderBy: { createdAt: "desc" },
            take: 40,
          }),
          prisma.insight.findMany({
            where: { schoolId },
            include: { requestedBy: true },
            orderBy: { createdAt: "desc" },
            take: 40,
          }),
        ])
      : [[], [], [], [], [], [], [], []];

  const timeline: TimelineEvent[] = [
    ...lessonPlanVersions.map((v) => ({
      date: v.printedAt,
      type: "lessonPlanPrinted" as const,
      title: v.lessonPlan.curriculumContent.lessonTitle,
      by: v.printedBy.name,
    })),
    ...initiativesForTimeline.map((i) => ({
      date: i.createdAt,
      type: "initiativeCreated" as const,
      title: i.title,
      by: i.owner.name,
    })),
    ...initiativesForTimeline
      .filter((i) => i.status === "COMPLETED")
      .map((i) => ({
        date: i.updatedAt,
        type: "initiativeCompleted" as const,
        title: i.title,
        by: i.owner.name,
      })),
    ...meetings.map((m) => ({
      date: m.date,
      type: "meetingHeld" as const,
      title: `${m.title} — ${m.team.name}`,
      by: m.createdBy.name,
    })),
    ...assessments.map((a) => ({
      date: a.createdAt,
      type: "assessmentCreated" as const,
      title: a.title,
      by: a.teacher.name,
    })),
    ...insights.map((i) => ({
      date: i.createdAt,
      type: "insightGenerated" as const,
      title: t(`timeline.scopes.${i.scope}`),
      by: i.requestedBy.name,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 60);

  return (
      <AppShell userName={user.name} role={user.role}>
      <main className="flex flex-col gap-10 p-6">
        <section>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">{t("timelineTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("timelineSubtitle")}</p>
          <ol className="mt-4 flex flex-col gap-3 border-e-2 border-slate-200 pe-4">
            {timeline.map((event, index) => (
              <li key={index} className="relative ps-4">
                <span className="absolute -start-[calc(1rem+3px)] top-1.5 h-2 w-2 rounded-full bg-slate-400" />
                <p className="text-sm">
                  <span className="font-medium">{t(`timeline.types.${event.type}`)}</span> — {event.title}
                </p>
                <p className="text-xs text-slate-500" dir="ltr">
                  {formatTimestamp(event.date)} · {event.by}
                </p>
              </li>
            ))}
            {timeline.length === 0 && <p className="text-sm text-slate-400">{t("timeline.empty")}</p>}
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold">{t("evidenceTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("evidenceSubtitle")}</p>
          <div className="mt-4 flex flex-col gap-3">
            {evidenceItems.map((e) => (
              <div key={e.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                <p className="font-medium">{e.description}</p>
                <p className="text-xs text-slate-500">
                  {e.initiative.title} · {e.createdBy.name} ·{" "}
                  <span dir="ltr">{formatTimestamp(e.createdAt)}</span>
                </p>
                <div className="mt-1 flex gap-3 text-xs">
                  {e.fileUrl && (
                    <a href={e.fileUrl} target="_blank" rel="noreferrer" className="text-slate-600 underline">
                      {e.fileName ?? t("attachedFile")}
                    </a>
                  )}
                  {e.link && (
                    <a href={e.link} target="_blank" rel="noreferrer" className="text-slate-600 underline">
                      {e.link}
                    </a>
                  )}
                </div>
              </div>
            ))}
            {evidenceItems.length === 0 && <p className="text-sm text-slate-400">{t("evidenceEmpty")}</p>}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">{t("reportsTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{tImpact("subtitle")}</p>
          <div className="mt-4 flex flex-col gap-6">
            {initiativesWithIndicators.map((initiative) => (
              <div key={initiative.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="font-medium">{initiative.title}</h3>
                <p className="text-xs text-slate-500">
                  {tInit(`statuses.${initiative.status}`)} · {initiative.owner.name}
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 text-left text-slate-500">
                      <tr>
                        <th className="px-2 py-1 font-medium">{tImpact("indicator")}</th>
                        <th className="px-2 py-1 font-medium">{tImpact("baseline")}</th>
                        <th className="px-2 py-1 font-medium">{tImpact("current")}</th>
                        <th className="px-2 py-1 font-medium">{tImpact("target")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {initiative.indicators.map((indicator) => (
                        <tr key={indicator.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-2 py-1 font-medium">{indicator.name}</td>
                          <td className="px-2 py-1 text-slate-600">{indicator.baselineValue || "—"}</td>
                          <td className="px-2 py-1 text-slate-600">{indicator.actualValue || "—"}</td>
                          <td className="px-2 py-1 text-slate-600">{indicator.targetValue || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {initiativesWithIndicators.length === 0 && <p className="text-sm text-slate-400">{tImpact("empty")}</p>}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">{tAudit("aiLogTitle")}</h2>
          <p className="mt-1 text-sm text-slate-500">{tAudit("aiLogSubtitle")}</p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">{tAudit("time")}</th>
                  <th className="px-4 py-2 font-medium">{tAudit("user")}</th>
                  <th className="px-4 py-2 font-medium">{tAudit("source")}</th>
                  <th className="px-4 py-2 font-medium">{tAudit("status")}</th>
                  <th className="px-4 py-2 font-medium">{tAudit("quality")}</th>
                  <th className="px-4 py-2 font-medium">{tAudit("feedback")}</th>
                </tr>
              </thead>
              <tbody>
                {aiLogs.map((log) => {
                  const source = log.lessonPlan
                    ? `${tAudit("sourceTypes.lessonPlan")} · ${log.lessonPlan.curriculumContent.lessonTitle}`
                    : log.initiative
                      ? `${tAudit("sourceTypes.initiative")} · ${log.initiative.title}`
                      : log.operationalPlan
                        ? `${tAudit("sourceTypes.operationalPlan")} · ${log.operationalPlan.title}`
                        : log.assessment
                          ? `${tAudit("sourceTypes.assessment")} · ${log.assessment.title}`
                          : log.insight
                            ? `${tAudit("sourceTypes.insight")} · ${log.insight.scope}`
                            : "—";
                  const upCount = log.feedback.filter((f) => f.rating === "UP").length;
                  const downCount = log.feedback.filter((f) => f.rating === "DOWN").length;
                  return (
                    <tr key={log.id} className="border-b border-slate-100 last:border-0">
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600" dir="ltr">
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{log.user.name}</td>
                      <td className="px-4 py-2 text-slate-600">{source}</td>
                      <td className="px-4 py-2">
                        <span className={log.status === "SUCCESS" ? "text-green-700" : "text-red-600"}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-600" dir="ltr">
                        {log.qualityScore !== null ? `${log.qualityScore}/100` : "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-600" dir="ltr">
                        {upCount > 0 || downCount > 0 ? `👍${upCount} 👎${downCount}` : "—"}
                      </td>
                    </tr>
                  );
                })}
                {aiLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      {tAudit("noAiLogs")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
