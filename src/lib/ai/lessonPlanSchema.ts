import { z } from "zod";

export const LessonPlanContentSchema = z.object({
  objectives: z.array(z.string()).min(1).describe("Clear, measurable lesson objectives"),
  lessonFlow: z.object({
    intro: z.string().describe("Opening/warm-up activity"),
    development: z.string().describe("Main concept explanation and guided practice"),
    application: z.string().describe("Independent or group application activity"),
    closure: z.string().describe("Closing/wrap-up activity that checks understanding"),
  }),
  activities: z.array(z.string()).min(1).describe("Specific learning activities used during the lesson"),
  assessment: z.string().describe("How student understanding will be assessed during/after the lesson"),
  differentiation: z.object({
    support: z.string().describe("Support strategies for struggling students"),
    enrichment: z.string().describe("Enrichment strategies for advanced students"),
  }),
  reflection: z.string().describe("Prompt for the teacher to reflect on after teaching the lesson"),
});

export type LessonPlanContent = z.infer<typeof LessonPlanContentSchema>;

export const LESSON_PLAN_SECTIONS = [
  "objectives",
  "lessonFlow",
  "activities",
  "assessment",
  "differentiation",
  "reflection",
] as const;
export type LessonPlanSection = (typeof LESSON_PLAN_SECTIONS)[number];
