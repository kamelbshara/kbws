import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client";
import {
  IndicatorAnalysisSchema,
  InitiativeReflectionSchema,
  type IndicatorAnalysis,
  type InitiativeReflectionGeneration,
} from "@/lib/ai/initiativeAnalysisSchema";
import { formatKnowledgeContext } from "@/lib/ai/knowledgeContext";

function languageInstruction(locale: "ar" | "en") {
  return locale === "ar"
    ? "Write all content in formal Modern Standard Arabic (اللغة العربية الفصحى)."
    : "Write all content in clear, professional English.";
}

export async function generateIndicatorAnalysis(input: {
  goal: string;
  indicators: { name: string; measurementMethod: string; baselineValue: string; targetValue: string; actualValue: string }[];
  locale: "ar" | "en";
  knowledgeNotes?: string[];
}): Promise<{ content: IndicatorAnalysis }> {
  const system = [
    "You are an expert in monitoring and evaluation for school improvement initiatives.",
    languageInstruction(input.locale),
    "For each indicator with a recorded actual result, write a concise, honest analysis of performance versus the baseline and target -- note whether the target was met, exceeded, or missed, and why that matters.",
    "Follow the provided JSON schema exactly.",
  ].join(" ");

  const user = [
    `Initiative goal: ${input.goal}`,
    "Indicators:",
    ...input.indicators.map(
      (i) => `- ${i.name} | method: ${i.measurementMethod} | baseline: ${i.baselineValue || "n/a"} | target: ${i.targetValue} | actual: ${i.actualValue}`,
    ),
    formatKnowledgeContext(input.knowledgeNotes ?? []),
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const completion = await getOpenAIClient().chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(IndicatorAnalysisSchema, "indicator_analysis"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("The model did not return parsed indicator analyses.");
  }
  return { content: IndicatorAnalysisSchema.parse(parsed) };
}

export async function generateInitiativeReflection(input: {
  title: string;
  goal: string;
  phases: { name: string; description: string }[];
  indicators: { name: string; targetValue: string; actualValue: string }[];
  evidenceDescriptions: string[];
  locale: "ar" | "en";
  knowledgeNotes?: string[];
}): Promise<{ content: InitiativeReflectionGeneration }> {
  const system = [
    "You are an expert school-improvement facilitator helping a staff member reflect on a completed or in-progress initiative.",
    languageInstruction(input.locale),
    "Write a genuine, specific reflection -- what worked, what didn't, and what should change next time. Avoid generic platitudes.",
    "Follow the provided JSON schema exactly.",
  ].join(" ");

  const user = [
    `Initiative: ${input.title}`,
    `Goal: ${input.goal}`,
    `Phases: ${input.phases.map((p) => `${p.name} (${p.description})`).join("; ")}`,
    `Indicator results: ${input.indicators.map((i) => `${i.name}: target ${i.targetValue}, actual ${i.actualValue || "not yet recorded"}`).join("; ")}`,
    input.evidenceDescriptions.length > 0 ? `Evidence collected: ${input.evidenceDescriptions.join("; ")}` : "No evidence collected yet.",
    formatKnowledgeContext(input.knowledgeNotes ?? []),
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  const completion = await getOpenAIClient().chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(InitiativeReflectionSchema, "initiative_reflection"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("The model did not return a parsed reflection.");
  }
  return { content: InitiativeReflectionSchema.parse(parsed) };
}
