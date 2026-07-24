import type { LessonPlanContent } from "@/lib/ai/lessonPlanSchema";
import { formatKnowledgeContext } from "@/lib/ai/knowledgeContext";

export type WorksheetPromptInput = {
  subjectName: string;
  gradeName: string;
  unitTitle: string;
  lessonTitle: string;
  outcomeText: string;
  lessonPlanContent: LessonPlanContent;
  locale: "ar" | "en";
  knowledgeNotes?: string[];
};

export function buildWorksheetPrompt(input: WorksheetPromptInput): { system: string; user: string } {
  const languageInstruction =
    input.locale === "ar"
      ? "Write all content in formal Modern Standard Arabic (اللغة العربية الفصحى)."
      : "Write all content in clear, professional English.";

  const system = [
    "You are an expert educational assistant creating a student practice worksheet from an already-planned lesson.",
    languageInstruction,
    "Follow the provided JSON schema exactly.",
    "The worksheet must directly practice the lesson's objectives and learning outcome, be age-appropriate, and be answerable using only what was covered in the lesson.",
    "Mix short-answer and multiple-choice questions where appropriate. Multiple-choice questions must include plausible distractors.",
  ].join(" ");

  const user = [
    `Subject: ${input.subjectName}`,
    `Grade: ${input.gradeName}`,
    `Unit: ${input.unitTitle}`,
    `Lesson: ${input.lessonTitle}`,
    `Learning outcome: ${input.outcomeText}`,
    `Lesson objectives: ${input.lessonPlanContent.objectives.join("; ")}`,
    `Lesson activities: ${input.lessonPlanContent.activities.join("; ")}`,
    `How understanding is assessed in class: ${input.lessonPlanContent.assessment}`,
    formatKnowledgeContext(input.knowledgeNotes ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}
