import type { LessonPlanSection } from "@/lib/ai/lessonPlanSchema";
import { formatKnowledgeContext } from "@/lib/ai/knowledgeContext";

export type LessonPlanPromptInput = {
  subjectName: string;
  gradeName: string;
  track?: string | null;
  unitTitle: string;
  lessonTitle: string;
  outcomeText: string;
  teacherPrompt: string;
  durationMinutes: number;
  strategies: string[];
  tools: string[];
  locale: "ar" | "en";
  focusSection?: LessonPlanSection;
  knowledgeNotes?: string[];
};

export function buildLessonPlanPrompt(input: LessonPlanPromptInput): { system: string; user: string } {
  const languageInstruction =
    input.locale === "ar"
      ? "Write all content in formal Modern Standard Arabic (اللغة العربية الفصحى)."
      : "Write all content in clear, professional English.";

  const system = [
    "You are an expert educational planning assistant helping a K-12 teacher build a structured lesson plan.",
    languageInstruction,
    "Follow the provided JSON schema exactly.",
    "Content must be pedagogically sound, age-appropriate for the given grade, realistic to execute within the lesson duration, and directly aligned with the stated learning outcome.",
    "Include differentiation for both struggling and advanced students, and an assessment approach that measures whether the learning outcome was achieved.",
  ].join(" ");

  const focusInstruction = input.focusSection
    ? `\n\nThe teacher specifically asked to regenerate the "${input.focusSection}" section — put extra care and detail into that section, while still returning a complete, internally consistent lesson plan.`
    : "";

  const user = [
    `Subject: ${input.subjectName}`,
    `Grade: ${input.gradeName}${input.track ? ` (${input.track} track)` : ""}`,
    `Unit: ${input.unitTitle}`,
    `Lesson: ${input.lessonTitle}`,
    `Learning outcome: ${input.outcomeText}`,
    `Lesson duration: ${input.durationMinutes} minutes`,
    input.strategies.length > 0 ? `Preferred teaching strategies: ${input.strategies.join(", ")}` : null,
    input.tools.length > 0 ? `Available teaching tools: ${input.tools.join(", ")}` : null,
    `Teacher's focus for this lesson: ${input.teacherPrompt}`,
    focusInstruction,
    formatKnowledgeContext(input.knowledgeNotes ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}
