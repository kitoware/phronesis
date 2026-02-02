import { ChatOpenAI } from "@langchain/openai";

/**
 * Creates an OpenRouter-compatible LLM client using LangChain's ChatOpenAI.
 * Uses Claude via OpenRouter for high-quality reasoning.
 */
export function createLLM(options?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  return new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: options?.model ?? "anthropic/claude-sonnet-4",
    temperature: options?.temperature ?? 0.3,
    maxTokens: options?.maxTokens ?? 4096,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
  });
}
