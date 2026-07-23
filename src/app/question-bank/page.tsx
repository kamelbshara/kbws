import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import type { QuestionDifficulty, QuestionType } from "@/generated/prisma/enums";
import { AppShell } from "@/components/layout/AppShell";

const DIFFICULTIES: QuestionDifficulty[] = ["EASY", "MEDIUM", "ADVANCED", "CHALLENGE"];
const TYPES: QuestionType[] = ["MULTIPLE_CHOICE", "OPEN"];

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<{ subjectId?: string; gradeId?: string; difficulty?: string; type?: string; q?: string }>;
}) {
  const session = await auth();
  const user = session!.user;

  const canAccess = (await getRoleGroup("TEACHER_ROLES")).includes(user.role) || (await getRoleGroup("MANAGEMENT_ROLES")).includes(user.role);
  if (!canAccess) {
    redirect("/");
  }

  const t = await getTranslations("questionBank");
  const tAssess = await getTranslations("assessments");
  const schoolId = await getActiveSchoolId(session!);
  const params = await searchParams;

  const [subjects, grades, items] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.grade.findMany({ orderBy: { level: "asc" } }),
    schoolId
      ? prisma.questionBankItem.findMany({
          where: {
            createdBy: { schoolId },
            subjectId: params.subjectId || undefined,
            gradeId: params.gradeId || undefined,
            difficulty: (params.difficulty as QuestionDifficulty) || undefined,
            type: (params.type as QuestionType) || undefined,
            questionText: params.q ? { contains: params.q, mode: "insensitive" } : undefined,
          },
          include: { subject: true, grade: true, createdBy: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : Promise.resolve([]),
  ]);

  return (
      <AppShell userName={user.name} role={user.role}>
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>

        <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="subjectId" className="text-xs text-slate-500">
              {t("subject")}
            </label>
            <select
              id="subjectId"
              name="subjectId"
              defaultValue={params.subjectId ?? ""}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">{t("allSubjects")}</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="gradeId" className="text-xs text-slate-500">
              {t("grade")}
            </label>
            <select
              id="gradeId"
              name="gradeId"
              defaultValue={params.gradeId ?? ""}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">{t("allGrades")}</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="difficulty" className="text-xs text-slate-500">
              {tAssess("difficultyLabel")}
            </label>
            <select
              id="difficulty"
              name="difficulty"
              defaultValue={params.difficulty ?? ""}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">{t("allDifficulties")}</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {tAssess(`difficulties.${d}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="type" className="text-xs text-slate-500">
              {tAssess("typeLabel")}
            </label>
            <select
              id="type"
              name="type"
              defaultValue={params.type ?? ""}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">{t("allTypes")}</option>
              {TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {ty === "MULTIPLE_CHOICE" ? tAssess("multipleChoice") : tAssess("open")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="q" className="text-xs text-slate-500">
              {t("search")}
            </label>
            <input
              id="q"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder={t("searchPlaceholder")}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            />
          </div>
          <button
            type="submit"
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            {t("filter")}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{item.subject.name}</span>
                <span>·</span>
                <span>{item.grade.name}</span>
                <span>·</span>
                <span>{tAssess(`difficulties.${item.difficulty}`)}</span>
                <span>·</span>
                <span>{item.type === "MULTIPLE_CHOICE" ? tAssess("multipleChoice") : tAssess("open")}</span>
                <span>·</span>
                <span>{item.skill}</span>
              </div>
              <p className="mt-1 font-medium text-slate-800">{item.questionText}</p>
              {item.type === "MULTIPLE_CHOICE" && Array.isArray(item.choices) && (
                <ul className="mt-1 flex flex-col gap-0.5 text-xs text-slate-600">
                  {(item.choices as string[]).map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {t("createdBy")} {item.createdBy.name}
              </p>
            </div>
          ))}
          {items.length === 0 && <p className="py-6 text-center text-sm text-slate-400">{t("empty")}</p>}
        </div>
      </main>
    </AppShell>
  );
}
