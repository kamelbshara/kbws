import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client";
import { InsightGenerationSchema, type InsightGeneration } from "@/lib/ai/insightSchema";
import { buildInsightPrompt, type InsightPromptInput } from "@/lib/ai/insightPrompt";

export async function generateInsights(input: InsightPromptInput): Promise<{
  content: InsightGeneration;
  promptInput: InsightPromptInput;
}> {
  const { system, user } = buildInsightPrompt(input);

  const completion = await getOpenAIClient().chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(InsightGenerationSchema, "insight_report"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("The model did not return a parsed insight report.");
  }

  const content = InsightGenerationSchema.parse(parsed);
  return { content, promptInput: input };
}
