import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client";
import { ProfessionalGoalSuggestionsSchema, type ProfessionalGoalSuggestions } from "@/lib/ai/professionalGoalSchema";
import { buildProfessionalGoalPrompt, type ProfessionalGoalPromptInput } from "@/lib/ai/professionalGoalPrompt";

export async function generateProfessionalGoals(input: ProfessionalGoalPromptInput): Promise<{
  suggestions: ProfessionalGoalSuggestions;
}> {
  const { system, user } = buildProfessionalGoalPrompt(input);

  const completion = await getOpenAIClient().chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(ProfessionalGoalSuggestionsSchema, "professional_goals"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("The model did not return parsed professional goal suggestions.");
  }

  return { suggestions: ProfessionalGoalSuggestionsSchema.parse(parsed) };
}
