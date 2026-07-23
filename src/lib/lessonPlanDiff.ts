import type { LessonPlanContent } from "@/lib/ai/lessonPlanSchema";

export type LessonPlanField = { key: string; text: string };

export const LESSON_PLAN_FIELD_KEYS = [
  "objectives",
  "lessonFlowIntro",
  "lessonFlowDevelopment",
  "lessonFlowApplication",
  "lessonFlowClosure",
  "activities",
  "assessment",
  "differentiationSupport",
  "differentiationEnrichment",
  "reflection",
] as const;

/** Flattens a LessonPlanContent into an ordered list of keyed text fields, for display and diffing. */
export function flattenLessonPlanContent(content: LessonPlanContent): LessonPlanField[] {
  return [
    { key: "objectives", text: content.objectives.join("\n") },
    { key: "lessonFlowIntro", text: content.lessonFlow.intro },
    { key: "lessonFlowDevelopment", text: content.lessonFlow.development },
    { key: "lessonFlowApplication", text: content.lessonFlow.application },
    { key: "lessonFlowClosure", text: content.lessonFlow.closure },
    { key: "activities", text: content.activities.join("\n") },
    { key: "assessment", text: content.assessment },
    { key: "differentiationSupport", text: content.differentiation.support },
    { key: "differentiationEnrichment", text: content.differentiation.enrichment },
    { key: "reflection", text: content.reflection },
  ];
}
