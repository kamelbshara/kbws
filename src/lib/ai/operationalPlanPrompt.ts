import { formatKnowledgeContext } from "@/lib/ai/knowledgeContext";

export type OperationalPlanPromptInput = {
  title: string;
  level: "TEAM" | "SCHOOL";
  initialIdea: string;
  locale: "ar" | "en";
  knowledgeNotes?: string[];
};

export function buildOperationalPlanPrompt(input: OperationalPlanPromptInput): { system: string; user: string } {
  const languageInstruction =
    input.locale === "ar"
      ? "Write all content in formal Modern Standard Arabic (اللغة العربية الفصحى)."
      : "Write all content in clear, professional English.";

  const scopeInstruction =
    input.level === "SCHOOL"
      ? "This is a school-wide development plan spanning multiple domains and departments."
      : "This is a single team's operational plan — keep objectives scoped to what one team can realistically own.";

  const system = [
    "You are an expert in school operational planning, helping build a structured implementation matrix.",
    languageInstruction,
    scopeInstruction,
    "Follow the provided JSON schema exactly.",
    "Each item needs a distinct domain/axis, a specific measurable objective, concrete actions, a realistic timeline, a genuinely measurable indicator, and one realistic risk with a brief mitigation.",
    "Avoid vague or generic items — every item should be something a real school team could execute and report progress on.",
  ].join(" ");

  const user = [
    `Plan title: ${input.title}`,
    `Description / starting idea: ${input.initialIdea}`,
    formatKnowledgeContext(input.knowledgeNotes ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}
