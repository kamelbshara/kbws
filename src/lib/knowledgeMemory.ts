import { prisma } from "@/lib/prisma";

export const KNOWLEDGE_MODULES = ["LESSON_PLAN", "INITIATIVE", "OPERATIONAL_PLAN", "ASSESSMENT", "INSIGHT"] as const;
export type KnowledgeModule = (typeof KNOWLEDGE_MODULES)[number];

/**
 * Returns up to `limit` institutional best-practice notes relevant to a
 * generation request -- matching module, and preferring notes scoped to the
 * same subject/grade over general ones. Injected into the AI prompt as extra
 * context so the platform's own accumulated experience shapes new output.
 */
export async function getRelevantKnowledge(
  schoolId: string,
  module: KnowledgeModule,
  options: { subjectId?: string | null; gradeId?: string | null } = {},
  limit = 3,
): Promise<string[]> {
  const items = await prisma.knowledgeMemoryItem.findMany({
    where: {
      schoolId,
      module,
      OR: [
        { subjectId: options.subjectId ?? undefined, gradeId: options.gradeId ?? undefined },
        { subjectId: null, gradeId: null },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit * 3,
  });

  const scoped = items.filter((i) => i.subjectId === options.subjectId && i.gradeId === options.gradeId);
  const general = items.filter((i) => i.subjectId === null && i.gradeId === null);
  const ordered = [...scoped, ...general].slice(0, limit);

  return ordered.map((i) => `${i.title}: ${i.content}`);
}
