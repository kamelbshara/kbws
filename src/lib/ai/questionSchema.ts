import { z } from "zod";

export const QuestionItemSchema = z.object({
  type: z.enum(["MULTIPLE_CHOICE", "OPEN"]),
  difficulty: z.enum(["EASY", "MEDIUM", "ADVANCED", "CHALLENGE"]),
  skill: z.string().describe("The specific skill or concept this question measures"),
  questionText: z.string(),
  choices: z
    .array(z.string())
    .optional()
    .describe("Exactly 4 options for multiple-choice questions; omit for open questions"),
  correctAnswer: z
    .string()
    .describe("For multiple-choice: the exact text of the correct choice. For open: a model answer."),
  explanation: z.string().describe("Brief explanation of why the answer is correct"),
});
export type QuestionItem = z.infer<typeof QuestionItemSchema>;

/** Constrains AI output quality: a freshly generated assessment should have real substance. */
export const AssessmentGenerationSchema = z.object({
  questions: z.array(QuestionItemSchema).min(3).max(20),
});
export type AssessmentGeneration = z.infer<typeof AssessmentGenerationSchema>;

/** Used when persisting user edits — a teacher may legitimately trim questions below the AI's minimum. */
export const AssessmentSaveSchema = z.object({
  questions: z.array(QuestionItemSchema).max(50),
});
