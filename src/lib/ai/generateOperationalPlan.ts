import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client";
import { OperationalPlanGenerationSchema, type OperationalPlanGeneration } from "@/lib/ai/operationalPlanSchema";
import { buildOperationalPlanPrompt, type OperationalPlanPromptInput } from "@/lib/ai/operationalPlanPrompt";

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
