import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { getActiveSchoolId } from "@/lib/activeSchool";
import type { AuditAction } from "@/generated/prisma/enums";

const PAGE_SIZE = 25;
const AUDIT_ACTIONS: AuditAction[] = ["CREATE", "UPDATE", "DELETE"];

function formatTimestamp(date: Date) {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; action?: string; page?: string }>;
}) {
  const session = await auth();
  const user = session!.user;
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const moduleFilter = params.module && params.module !== "ALL" ? params.module : undefined;
  const actionFilter =
    params.action && AUDIT_ACTIONS.includes(params.action as AuditAction) ? (params.action as AuditAction) : undefined;

  const schoolId = await getActiveSchoolId(session!);

  const where = {
    user: { schoolId },
    ...(moduleFilter ? { module: moduleFilter } : {}),
    ...(actionFilter ? { action: actionFilter } : {}),
  };

  const [modules, total, entries, aiLogs] = schoolId
    ? await Promise.all([
        prisma.auditLog.findMany({
          where: { user: { schoolId } },
          distinct: ["module"],
          select: { module: true },
          orderBy: { module: "asc" },
        }),
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          include: { user: true },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.aIGenerationLog.findMany({
          where: { user: { schoolId } },
          include: {
            user: true,
            lessonPlan: { include: { curriculumContent: true } },
            initiative: true,
            operationalPlan: true,
            assessment: true,
            insight: true,
          },
          orderBy: { createdAt: "desc" },
          take: 25,
        }),
      ])
    : [[], 0, [], []];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <AdminNav role={user.role} />
      <main className="flex flex-col gap-8 p-6">
        <section>
          <h1 className="text-xl font-semibold">Audit Log</h1>

          <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="module" className="text-xs text-slate-500">
                Module
              </label>
              <select
                id="module"
                name="module"
                defaultValue={moduleFilter ?? "ALL"}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="ALL">All modules</option>
                {modules.map((m) => (
                  <option key={m.module} value={m.module}>
                    {m.module}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="action" className="text-xs text-slate-500">
                Action
              </label>
              <select
                id="action"
                name="action"
                defaultValue={actionFilter ?? "ALL"}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="ALL">All actions</option>
                {AUDIT_ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              Filter
            </button>
          </form>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Time (UTC)</th>
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Module</th>
                  <th className="px-4 py-2 font-medium">Entity ID</th>
                  <th className="px-4 py-2 font-medium">Changes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600" dir="ltr">
                      {formatTimestamp(e.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{e.user?.name ?? "—"}</td>
                    <td className="px-4 py-2">{e.action}</td>
                    <td className="px-4 py-2 text-slate-600">{e.module}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-500">{e.entityId}</td>
                    <td className="px-4 py-2">
                      {(e.beforeJson || e.afterJson) && (
                        <details>
                          <summary className="cursor-pointer text-slate-500 hover:text-slate-900">View</summary>
                          <div className="mt-2 flex flex-col gap-2">
                            {e.beforeJson ? (
                              <div>
                                <p className="text-xs text-slate-500">Before</p>
                                <pre className="max-w-md overflow-x-auto rounded bg-slate-50 p-2 text-xs">
                                  {JSON.stringify(e.beforeJson, null, 2)}
                                </pre>
                              </div>
                            ) : null}
                            {e.afterJson ? (
                              <div>
                                <p className="text-xs text-slate-500">After</p>
                                <pre className="max-w-md overflow-x-auto rounded bg-slate-50 p-2 text-xs">
                                  {JSON.stringify(e.afterJson, null, 2)}
                                </pre>
                              </div>
                            ) : null}
                          </div>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No audit entries match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
              <span>
                Page {page} of {totalPages} ({total} entries)
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50"
                    href={`?module=${moduleFilter ?? "ALL"}&action=${actionFilter ?? "ALL"}&page=${page - 1}`}
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50"
                    href={`?module=${moduleFilter ?? "ALL"}&action=${actionFilter ?? "ALL"}&page=${page + 1}`}
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold">AI Generation Log</h2>
          <p className="mt-1 text-sm text-slate-500">Most recent 25 AI generation attempts across all modules.</p>

          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Time (UTC)</th>
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 font-medium">Source</th>
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {aiLogs.map((log) => {
                  const source = log.lessonPlan
                    ? `Lesson Plan · ${log.lessonPlan.curriculumContent.lessonTitle}`
                    : log.initiative
                      ? `Initiative · ${log.initiative.title}`
                      : log.operationalPlan
                        ? `Operational Plan · ${log.operationalPlan.title}`
                        : log.assessment
                          ? `Assessment · ${log.assessment.title}`
                          : log.insight
                            ? `Insight · ${log.insight.scope}`
                            : "—";
                  return (
                    <tr key={log.id} className="border-b border-slate-100 last:border-0">
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600" dir="ltr">
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{log.user.name}</td>
                      <td className="px-4 py-2 text-slate-600">{source}</td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-500">{log.model}</td>
                      <td className="px-4 py-2">
                        <span className={log.status === "SUCCESS" ? "text-green-700" : "text-red-600"}>
                          {log.status}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-4 py-2 text-xs text-slate-500">{log.errorMessage ?? "—"}</td>
                    </tr>
                  );
                })}
                {aiLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No AI generation attempts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
