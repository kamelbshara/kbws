import { z } from "zod";

export const WorksheetQuestionSchema = z.object({
  text: z.string().describe("The question or exercise prompt shown to the student"),
  type: z.enum(["SHORT_ANSWER", "MULTIPLE_CHOICE"]).describe("How the student should answer"),
  choices: z.array(z.string()).optional().describe("Answer choices, only for MULTIPLE_CHOICE questions"),
});

export const WorksheetContentSchema = z.object({
  title: z.string().describe("A short worksheet title"),
  instructions: z.string().describe("Instructions shown to the student at the top of the worksheet"),
  questions: z.array(WorksheetQuestionSchema).min(3).describe("The worksheet's questions/exercises"),
});

export type WorksheetContent = z.infer<typeof WorksheetContentSchema>;
export type WorksheetQuestion = z.infer<typeof WorksheetQuestionSchema>;
