import { formatKnowledgeContext } from "@/lib/ai/knowledgeContext";

export type OperationalPlanPromptInput = {
  title: string;
  level: "TEAM" | "SCHOOL";
  initialIdea: string;
  locale: "ar" | "en";
  knowledgeNotes?: string[];
  axes?: string[];
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

  const axesInstruction =
    input.axes && input.axes.length > 0
      ? `\n\nThe plan's axes/domains have already been decided -- produce exactly one item per axis, in this order, using this exact text as each item's "domain": ${input.axes.map((a, i) => `${i + 1}. ${a}`).join("; ")}`
      : "";

  const user = [
    `Plan title: ${input.title}`,
    `Description / starting idea: ${input.initialIdea}`,
    axesInstruction,
    formatKnowledgeContext(input.knowledgeNotes ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export function buildOperationalPlanAxesPrompt(input: {
  title: string;
  level: "TEAM" | "SCHOOL";
  initialIdea: string;
  locale: "ar" | "en";
}): { system: string; user: string } {
  const languageInstruction =
    input.locale === "ar"
      ? "Write all content in formal Modern Standard Arabic (اللغة العربية الفصحى)."
      : "Write all content in clear, professional English.";

  const scopeInstruction =
    input.level === "SCHOOL"
      ? "This is a school-wide development plan spanning multiple domains and departments."
      : "This is a single team's operational plan -- keep the axes scoped to what one team can realistically own.";

  const system = [
    "You are an expert in school operational planning.",
    languageInstruction,
    scopeInstruction,
    "Suggest only the plan's strategic domains/axes (short names, not full items) -- the detailed matrix will be generated in a later step.",
    "Follow the provided JSON schema exactly.",
  ].join(" ");

  const user = [`Plan title: ${input.title}`, `Description / starting idea: ${input.initialIdea}`].join("\n");

  return { system, user };
}
