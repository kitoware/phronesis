import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";
import { getOpenRouterConfig, OPENROUTER_API_URL } from "../llm/openrouter";

// Default embedding model (OpenAI via OpenRouter)
const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

interface EmbeddingResult {
  embedding: number[];
  model: string;
  inputTokens: number;
}

interface OpenRouterEmbeddingResponse {
  object: string;
  data: {
    object: string;
    embedding: number[];
    index: number;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

const GenerateEmbeddingSchema = z.object({
  text: z.string().min(1).max(8192).describe("Text to generate embedding for"),
  model: z
    .string()
    .optional()
    .default(DEFAULT_EMBEDDING_MODEL)
    .describe("Embedding model to use"),
});

export async function generateEmbeddingRaw(
  text: string,
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<EmbeddingResult> {
  const config = getOpenRouterConfig();

  const response = await fetch(`${OPENROUTER_API_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "HTTP-Referer": config.siteUrl || "",
      "X-Title": config.siteName || "",
    },
    body: JSON.stringify({
      model,
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
  }

  const data: OpenRouterEmbeddingResponse = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error("No embedding returned from API");
  }

  return {
    embedding: data.data[0].embedding,
    model: data.model,
    inputTokens: data.usage.prompt_tokens,
  };
}

export const generateEmbeddingTool = tool(
  async (input): Promise<ToolResult<EmbeddingResult>> => {
    const startTime = Date.now();
    try {
      const result = await generateEmbeddingRaw(input.text, input.model);

      return wrapToolSuccess(result, startTime, { source: "openrouter" });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "generate_embedding",
    description: `Generates a ${EMBEDDING_DIMENSIONS}-dimensional embedding vector for text using an embedding model`,
    schema: GenerateEmbeddingSchema,
  }
);

export const generateTools = [generateEmbeddingTool];
export { DEFAULT_EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
