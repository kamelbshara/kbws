export type InitiativePromptInput = {
  title: string;
  category: string;
  initialIdea: string;
  locale: "ar" | "en";
};

export function buildInitiativePrompt(input: InitiativePromptInput): { system: string; user: string } {
  const languageInstruction =
    input.locale === "ar"
      ? "Write all content in formal Modern Standard Arabic (اللغة العربية الفصحى)."
      : "Write all content in clear, professional English.";

  const system = [
    "You are an expert in school improvement planning, helping a staff member turn a rough initiative idea into a structured, actionable plan.",
    languageInstruction,
    "Follow the provided JSON schema exactly.",
    "The goal must be specific and measurable (a SMART goal), not vague.",
    "Phases must be realistic and sequential, moving from planning to implementation to evaluation.",
    "Indicators must be genuinely measurable — avoid indicators that can't be quantified or observed — and should mix indicators of implementation, results, and impact where appropriate.",
  ].join(" ");

  const user = [
    `Initiative title: ${input.title}`,
    `Category: ${input.category}`,
    `Initial idea from the staff member: ${input.initialIdea}`,
  ].join("\n");

  return { system, user };
}
