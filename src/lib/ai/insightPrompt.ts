export type InsightPromptInput = {
  scope: "TEACHER" | "SCHOOL";
  contextText: string;
  locale: "ar" | "en";
};

export function buildInsightPrompt(input: InsightPromptInput): { system: string; user: string } {
  const languageInstruction =
    input.locale === "ar"
      ? "Write all content in formal Modern Standard Arabic (اللغة العربية الفصحى)."
      : "Write all content in clear, professional English.";

  const audienceInstruction =
    input.scope === "TEACHER"
      ? "You are analyzing one teacher's own lesson plans and assessments to help them reflect on their teaching coverage and question quality."
      : "You are analyzing school-wide data across initiatives, teams, and assessments to help school management spot risks and opportunities.";

  const system = [
    "You are an expert instructional coach and school-improvement analyst.",
    audienceInstruction,
    languageInstruction,
    "Base every claim strictly on the data provided below — never invent numbers, names, or facts not present in it.",
    "If the data is too sparse to say something meaningful in a category, say so plainly rather than inventing content.",
    "Follow the provided JSON schema exactly.",
  ].join(" ");

  const user = [
    "Here is the aggregated data to analyze:",
    "",
    input.contextText,
  ].join("\n");

  return { system, user };
}
