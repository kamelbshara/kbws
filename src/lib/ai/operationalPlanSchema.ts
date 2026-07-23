import { z } from "zod";

export const OperationalPlanItemSchema = z.object({
  domain: z.string().describe("The strategic domain/axis this item belongs to"),
  objective: z.string().describe("A specific, actionable procedural objective"),
  actions: z.string().describe("The concrete actions/activities to achieve the objective"),
  responsible: z.string().describe("Suggested role responsible for this item, e.g. 'Team Leader' or 'Math Teachers'"),
  timeline: z.string().describe("Rough timeframe, e.g. 'Term 1'"),
  indicator: z.string().describe("A measurable performance indicator for this item"),
  risk: z.string().describe("A realistic risk to this item along with a brief mitigation"),
});

/** Constrains AI output quality: a freshly generated plan should have real substance. */
export const OperationalPlanGenerationSchema = z.object({
  items: z.array(OperationalPlanItemSchema).min(3).max(8),
});
export type OperationalPlanGeneration = z.infer<typeof OperationalPlanGenerationSchema>;

/** Used when persisting user edits — a team may legitimately trim items below the AI's minimum. */
export const OperationalPlanSaveSchema = z.object({
  items: z.array(OperationalPlanItemSchema).max(30),
});
