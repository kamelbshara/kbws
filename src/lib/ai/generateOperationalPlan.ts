import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client";
import {
  OperationalPlanGenerationSchema,
  OperationalPlanAxesSchema,
  type OperationalPlanGeneration,
  type OperationalPlanAxes,
} from "@/lib/ai/operationalPlanSchema";
import { buildOperationalPlanPrompt, buildOperationalPlanAxesPrompt, type OperationalPlanPromptInput } from "@/lib/ai/operationalPlanPrompt";

export async function generateOperationalPlan(input: OperationalPlanPromptInput): Promise<{
  content: OperationalPlanGeneration;
  promptInput: OperationalPlanPromptInput;
}> {
  const { system, user } = buildOperationalPlanPrompt(input);

  const completion = await getOpenAIClient().chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(OperationalPlanGenerationSchema, "operational_plan"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("The model did not return a parsed operational plan.");
  }

  const content = OperationalPlanGenerationSchema.parse(parsed);
  return { content, promptInput: input };
}

export async function generateOperationalPlanAxes(input: {
  title: string;
  level: "TEAM" | "SCHOOL";
  initialIdea: string;
  locale: "ar" | "en";
}): Promise<{ axes: OperationalPlanAxes }> {
  const { system, user } = buildOperationalPlanAxesPrompt(input);

  const completion = await getOpenAIClient().chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(OperationalPlanAxesSchema, "operational_plan_axes"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("The model did not return parsed plan axes.");
  }

  return { axes: OperationalPlanAxesSchema.parse(parsed) };
}
