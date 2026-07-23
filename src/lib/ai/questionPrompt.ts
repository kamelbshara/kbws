import { formatKnowledgeContext } from "@/lib/ai/knowledgeContext";

export type AssessmentPromptInput = {
  subjectName: string;
  gradeName: string;
  outcomeText: string;
  teacherPrompt?: string;
  questionCount: number;
  mcqRatio: number;
  locale: "ar" | "en";
  knowledgeNotes?: string[];
};

export function buildAssessmentPrompt(input: AssessmentPromptInput): { system: string; user: string } {
  const languageInstruction =
    input.locale === "ar"
      ? "Write all content in formal Modern Standard Arabic (اللغة العربية الفصحى)."
      : "Write all content in clear, professional English.";

  const mcqCount = Math.round(input.questionCount * input.mcqRatio);
  const openCount = input.questionCount - mcqCount;

  const system = [
    "You are an expert assessment writer helping a K-12 teacher build a question bank aligned to a specific learning outcome.",
    languageInstruction,
    "Follow the provided JSON schema exactly.",
    `Generate approximately ${mcqCount} multiple-choice questions (exactly 4 plausible choices each, one clearly correct) and ${openCount} open-response questions.`,
    "Vary the cognitive level across questions (recall, application, analysis) and vary difficulty across easy/medium/advanced.",
    "Each question must directly measure the stated learning outcome and be answerable within the grade level's expected knowledge — no ambiguous wording, no more than one defensible correct answer for multiple-choice.",
  ].join(" ");

  const user = [
    `Subject: ${input.subjectName}`,
    `Grade: ${input.gradeName}`,
    `Learning outcome: ${input.outcomeText}`,
    input.teacherPrompt ? `Teacher's additional focus: ${input.teacherPrompt}` : null,
    `Total questions: ${input.questionCount}`,
    formatKnowledgeContext(input.knowledgeNotes ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}
