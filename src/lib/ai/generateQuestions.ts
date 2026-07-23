import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client";
import { AssessmentGenerationSchema, type AssessmentGeneration } from "@/lib/ai/questionSchema";
import { buildAssessmentPrompt, type AssessmentPromptInput } from "@/lib/ai/questionPrompt";

export async function generateAssessmentQuestions(input: AssessmentPromptInput): Promise<{
  content: AssessmentGeneration;
  promptInput: AssessmentPromptInput;
}> {
  const { system, user } = buildAssessmentPrompt(input);

  const completion = await getOpenAIClient().chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(AssessmentGenerationSchema, "assessment_questions"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("The model did not return parsed questions.");
  }

  const content = AssessmentGenerationSchema.parse(parsed);
  return { content, promptInput: input };
}
