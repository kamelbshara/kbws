import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client";
import { InitiativeGenerationSchema, type InitiativeGeneration } from "@/lib/ai/initiativeSchema";
import { buildInitiativePrompt, type InitiativePromptInput } from "@/lib/ai/initiativePrompt";

export async function generateInitiativePlan(input: InitiativePromptInput): Promise<{
  content: InitiativeGeneration;
  promptInput: InitiativePromptInput;
}> {
  const { system, user } = buildInitiativePrompt(input);

  const completion = await getOpenAIClient().chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(InitiativeGenerationSchema, "initiative_plan"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("The model did not return a parsed initiative plan.");
  }

  const content = InitiativeGenerationSchema.parse(parsed);
  return { content, promptInput: input };
}
