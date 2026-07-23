import type { LessonPlanContent } from "@/lib/ai/lessonPlanSchema";
import type { InitiativeGeneration } from "@/lib/ai/initiativeSchema";
import type { OperationalPlanGeneration } from "@/lib/ai/operationalPlanSchema";
import type { AssessmentGeneration } from "@/lib/ai/questionSchema";
import type { InsightGeneration } from "@/lib/ai/insightSchema";

/**
 * Deterministic, rule-based quality checks run after every AI generation.
 * Not another AI call (no extra cost/latency, and testable without a live
 * API key) -- catches the class of issues Zod's structural schema can't:
 * suspiciously short fields, placeholder text, and duplicated content.
 */

export type QualityIssue = { code: "TOO_SHORT" | "TOO_FEW_ITEMS" | "PLACEHOLDER_TEXT" | "DUPLICATE_TEXT"; field: string };
export type QualityResult = { score: number; issues: QualityIssue[] };

const MIN_LEN = 15;
const PLACEHOLDER_PATTERNS = [/^n\/?a$/i, /^tbd$/i, /^todo$/i, /^\.{2,}$/, /^-+$/, /^(لا يوجد|غير محدد|تحديد لاحقاً)$/];

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function checkText(field: string, text: string, issues: QualityIssue[], minLen = MIN_LEN) {
  const trimmed = text.trim();
  if (trimmed.length < minLen) {
    issues.push({ code: "TOO_SHORT", field });
  } else if (PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed))) {
    issues.push({ code: "PLACEHOLDER_TEXT", field });
  }
}

function toScore(totalChecks: number, issueCount: number): number {
  if (totalChecks === 0) return 100;
  return Math.max(0, Math.round(((totalChecks - issueCount) / totalChecks) * 100));
}

export function evaluateLessonPlan(content: LessonPlanContent): QualityResult {
  const issues: QualityIssue[] = [];
  let checks = 0;

  checks++;
  if (content.objectives.length < 2) issues.push({ code: "TOO_FEW_ITEMS", field: "objectives" });
  checks++;
  checkText("objectives", content.objectives.join(" "), issues, 20);

  for (const key of ["intro", "development", "application", "closure"] as const) {
    checks++;
    checkText(`lessonFlow${cap(key)}`, content.lessonFlow[key], issues);
  }

  checks++;
  if (content.activities.length < 1) issues.push({ code: "TOO_FEW_ITEMS", field: "activities" });
  checks++;
  checkText("activities", content.activities.join(" "), issues, 20);

  checks++;
  checkText("assessment", content.assessment, issues);

  checks++;
  checkText("differentiationSupport", content.differentiation.support, issues);
  checks++;
  checkText("differentiationEnrichment", content.differentiation.enrichment, issues);
  if (
    content.differentiation.support.trim().length > 0 &&
    content.differentiation.support.trim().toLowerCase() === content.differentiation.enrichment.trim().toLowerCase()
  ) {
    checks++;
    issues.push({ code: "DUPLICATE_TEXT", field: "differentiationEnrichment" });
  }

  checks++;
  checkText("reflection", content.reflection, issues, 10);

  return { score: toScore(checks, issues.length), issues };
}

export function evaluateInitiative(content: InitiativeGeneration): QualityResult {
  const issues: QualityIssue[] = [];
  let checks = 0;

  checks++;
  checkText("goal", content.goal, issues, 20);
  checks++;
  checkText("targetGroup", content.targetGroup, issues);

  checks++;
  if (content.phases.length < 2) issues.push({ code: "TOO_FEW_ITEMS", field: "implementationPhases" });
  for (const phase of content.phases) {
    checks++;
    checkText("phaseDescription", phase.description, issues);
  }

  checks++;
  if (content.indicators.length < 2) issues.push({ code: "TOO_FEW_ITEMS", field: "performanceIndicators" });
  for (const indicator of content.indicators) {
    checks++;
    checkText("indicatorName", indicator.measurementMethod, issues, 10);
  }

  return { score: toScore(checks, issues.length), issues };
}

export function evaluateOperationalPlan(content: OperationalPlanGeneration): QualityResult {
  const issues: QualityIssue[] = [];
  let checks = 0;

  checks++;
  if (content.items.length < 3) issues.push({ code: "TOO_FEW_ITEMS", field: "matrixTitle" });

  for (const item of content.items) {
    checks++;
    checkText("objective", item.objective, issues);
    checks++;
    checkText("actions", item.actions, issues);
    checks++;
    checkText("indicator", item.indicator, issues, 8);
    checks++;
    checkText("risk", item.risk, issues, 8);
  }

  return { score: toScore(checks, issues.length), issues };
}

export function evaluateAssessment(content: AssessmentGeneration): QualityResult {
  const issues: QualityIssue[] = [];
  let checks = 0;

  checks++;
  if (content.questions.length < 3) issues.push({ code: "TOO_FEW_ITEMS", field: "questionCount" });

  for (const q of content.questions) {
    checks++;
    checkText("questionTextLabel", q.questionText, issues, 10);
    checks++;
    checkText("correctAnswerLabel", q.correctAnswer, issues, 1);
    checks++;
    checkText("explanationLabel", q.explanation, issues, 8);
    if (q.type === "MULTIPLE_CHOICE") {
      checks++;
      if (!q.choices || q.choices.length !== 4 || q.choices.some((c) => c.trim().length === 0)) {
        issues.push({ code: "TOO_FEW_ITEMS", field: "choices" });
      }
    }
  }

  return { score: toScore(checks, issues.length), issues };
}

export function evaluateInsight(content: InsightGeneration): QualityResult {
  const issues: QualityIssue[] = [];
  let checks = 0;

  checks++;
  checkText("summary", content.summary, issues, 30);

  checks++;
  if (content.strengths.length < 1) issues.push({ code: "TOO_FEW_ITEMS", field: "strengths" });
  checks++;
  if (content.concerns.length < 1) issues.push({ code: "TOO_FEW_ITEMS", field: "concerns" });
  checks++;
  if (content.recommendations.length < 1) issues.push({ code: "TOO_FEW_ITEMS", field: "recommendations" });

  return { score: toScore(checks, issues.length), issues };
}
