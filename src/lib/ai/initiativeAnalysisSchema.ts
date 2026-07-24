import { z } from "zod";

export const IndicatorAnalysisSchema = z.object({
  analyses: z
    .array(
      z.object({
        indicatorName: z.string().describe("Must exactly match one of the given indicator names"),
        analysis: z.string().describe("A concise analysis of the actual result versus the baseline and target"),
      }),
    )
    .describe("One analysis per indicator that has an actual result recorded"),
});
export type IndicatorAnalysis = z.infer<typeof IndicatorAnalysisSchema>;

export const InitiativeReflectionSchema = z.object({
  reflection: z.string().describe("A thoughtful reflection on the initiative's execution, results, and lessons learned"),
});
export type InitiativeReflectionGeneration = z.infer<typeof InitiativeReflectionSchema>;
