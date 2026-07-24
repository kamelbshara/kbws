import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client";
import { WorksheetContentSchema, type WorksheetContent } from "@/lib/ai/worksheetSchema";
import { buildWorksheetPrompt, type WorksheetPromptInput } from "@/lib/ai/worksheetPrompt";

export async function generateWorksheet(input: WorksheetPromptInput): Promise<{
  content: WorksheetContent;
  promptInput: WorksheetPromptInput;
}> {
  const { system, user } = buildWorksheetPrompt(input);

  const completion = await getOpenAIClient().chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: zodResponseFormat(WorksheetContentSchema, "worksheet"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error("The model did not return a parsed worksheet.");
  }

  const content = WorksheetContentSchema.parse(parsed);
  return { content, promptInput: input };
}
