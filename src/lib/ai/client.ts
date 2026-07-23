import OpenAI from "openai";

let client: OpenAI | null = null;

/** Lazily constructed so builds/imports don't fail before OPENAI_API_KEY is set. */
export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
