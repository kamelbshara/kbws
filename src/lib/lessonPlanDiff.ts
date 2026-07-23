import type { LessonPlanContent } from "@/lib/ai/lessonPlanSchema";

export type LessonPlanField = { key: string; label: string; text: string };

export const LESSON_PLAN_FIELD_LABELS: Record<string, string> = {
  objectives: "Objectives",
  "lessonFlow.intro": "Lesson Flow — Intro",
  "lessonFlow.development": "Lesson Flow — Development",
  "lessonFlow.application": "Lesson Flow — Application",
  "lessonFlow.closure": "Lesson Flow — Closure",
  activities: "Activities",
  assessment: "Assessment",
  "differentiation.support": "Differentiation — Support",
  "differentiation.enrichment": "Differentiation — Enrichment",
  reflection: "Reflection",
};

/** Flattens a LessonPlanContent into an ordered list of labeled text fields, for display and diffing. */
export function flattenLessonPlanContent(content: LessonPlanContent): LessonPlanField[] {
  return [
    { key: "objectives", text: content.objectives.join("\n") },
    { key: "lessonFlow.intro", text: content.lessonFlow.intro },
    { key: "lessonFlow.development", text: content.lessonFlow.development },
    { key: "lessonFlow.application", text: content.lessonFlow.application },
    { key: "lessonFlow.closure", text: content.lessonFlow.closure },
    { key: "activities", text: content.activities.join("\n") },
    { key: "assessment", text: content.assessment },
    { key: "differentiation.support", text: content.differentiation.support },
    { key: "differentiation.enrichment", text: content.differentiation.enrichment },
    { key: "reflection", text: content.reflection },
  ].map((f) => ({ ...f, label: LESSON_PLAN_FIELD_LABELS[f.key] }));
}
