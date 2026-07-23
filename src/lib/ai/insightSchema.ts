import { z } from "zod";

export const InsightGenerationSchema = z.object({
  summary: z.string().describe("A 2-4 sentence narrative overview of the current picture"),
  strengths: z.array(z.string()).min(1).max(6).describe("Specific things going well, grounded in the provided data"),
  concerns: z.array(z.string()).min(1).max(6).describe("Specific gaps, risks, or areas falling behind"),
  recommendations: z.array(z.string()).min(1).max(6).describe("Concrete, actionable next steps"),
});
export type InsightGeneration = z.infer<typeof InsightGenerationSchema>;
