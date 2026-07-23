import { z } from "zod";

export const InitiativePhaseSchema = z.object({
  name: z.string().describe("Short name of this implementation phase"),
  description: z.string().describe("What happens during this phase"),
  timeline: z.string().describe("Rough timeframe, e.g. 'Weeks 1-2'"),
});

export const InitiativeIndicatorSchema = z.object({
  name: z.string().describe("Name of the performance indicator"),
  measurementMethod: z.string().describe("How this indicator will be measured"),
  targetValue: z.string().describe("The target value or outcome for this indicator"),
});

/** Constrains AI output quality: a freshly generated plan should have a real, substantive shape. */
export const InitiativeGenerationSchema = z.object({
  goal: z.string().describe("A clear, specific, measurable SMART goal for the initiative"),
  targetGroup: z.string().describe("Who this initiative is meant to benefit"),
  phases: z.array(InitiativePhaseSchema).min(2).max(6),
  indicators: z.array(InitiativeIndicatorSchema).min(2).max(5),
});

export type InitiativeGeneration = z.infer<typeof InitiativeGenerationSchema>;

/** Used when persisting user edits — a teacher may legitimately trim phases/indicators below the AI's minimum. */
export const InitiativeSaveSchema = z.object({
  goal: z.string(),
  targetGroup: z.string(),
  phases: z.array(InitiativePhaseSchema).max(20),
  indicators: z.array(InitiativeIndicatorSchema).max(20),
});
