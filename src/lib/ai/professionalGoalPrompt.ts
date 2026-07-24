export type ProfessionalGoalPromptInput = {
  roleLabel: string;
  prompt: string;
  locale: "ar" | "en";
  knowledgeNotes?: string[];
};

export function buildProfessionalGoalPrompt(input: ProfessionalGoalPromptInput): { system: string; user: string } {
  const languageInstruction =
    input.locale === "ar"
      ? "Write all content in formal Modern Standard Arabic (اللغة العربية الفصحى)."
      : "Write all content in clear, professional English.";

  const system = [
    "You are an expert in K-12 educator professional development, helping a school staff member set a strong professional growth goal for the year.",
    languageInstruction,
    "Follow the provided JSON schema exactly.",
    "Every suggested goal must be a genuine SMART goal: Specific (a clear, well-defined outcome), Measurable (a concrete way to track progress), Achievable (realistic given a school-year timeframe), Relevant (directly connected to what the person described wanting to work on), and Time-bound (a clear deadline or milestone within the school year).",
    "Return at least 3 genuinely different SMART goals (not variations of the same idea) so the person has a real choice.",
  ].join(" ");

  const user = [
    `Role: ${input.roleLabel}`,
    `What they want to focus on: ${input.prompt}`,
    input.knowledgeNotes && input.knowledgeNotes.length > 0
      ? `Relevant context from the school's institutional memory:\n${input.knowledgeNotes.map((n) => `- ${n}`).join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}
