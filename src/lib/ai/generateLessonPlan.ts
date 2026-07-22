import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client";
import { LessonPlanContentSchema, type LessonPlanContent } from "@/lib/ai/lessonPlanSchema";
import { buildLessonPlanPrompt, type LessonPlanPromptInput } from "@/lib/ai/lessonPlanPrompt";

export async function generateLessonPlan(input: LessonPlanPromptInput): Promise<{
  content: LessonPlanContent;
  promptInput: LessonPlanPromptInput;
  rawResponse: unknown;
}> {
  const { system, user } = buildLessonPlanPrompt(input);

  const completion = await getOpenAIClient().chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(LessonPlanContentSchema, "lesson_plan"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("The model did not return a parsed lesson plan.");
  }

  // Defense-in-depth: re-validate against the schema before trusting the shape.
  const content = LessonPlanContentSchema.parse(parsed);

  return { content, promptInput: input, rawResponse: completion };
}
