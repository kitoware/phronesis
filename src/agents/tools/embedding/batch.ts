import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";
import { getOpenRouterConfig, OPENROUTER_API_URL } from "../llm/openrouter";
import { DEFAULT_EMBEDDING_MODEL } from "./generate";

interface BatchEmbeddingResult {
  embeddings: number[][];
  model: string;
  totalInputTokens: number;
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

const MAX_BATCH_SIZE = 100;
const MAX_TOKENS_PER_BATCH = 8192;

const BatchEmbeddingSchema = z.object({
  texts: z
    .array(z.string().min(1).max(8192))
    .min(1)
    .max(MAX_BATCH_SIZE)
    .describe("Array of texts to generate embeddings for"),
  model: z
    .string()
    .optional()
    .default(DEFAULT_EMBEDDING_MODEL)
    .describe("Embedding model to use"),
});

export async function batchEmbeddingsRaw(
  texts: string[],
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<BatchEmbeddingResult> {
  const config = getOpenRouterConfig();

  // Split into smaller batches if needed
  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let currentTokenEstimate = 0;

  for (const text of texts) {
    // Rough token estimate: ~4 chars per token
    const tokenEstimate = Math.ceil(text.length / 4);

    if (
      currentBatch.length >= MAX_BATCH_SIZE ||
      currentTokenEstimate + tokenEstimate > MAX_TOKENS_PER_BATCH
    ) {
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }
      currentBatch = [];
      currentTokenEstimate = 0;
    }

    currentBatch.push(text);
    currentTokenEstimate += tokenEstimate;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  // Process all batches
  const allEmbeddings: number[][] = [];
  let totalInputTokens = 0;
  let usedModel = model;

  for (const batch of batches) {
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
        input: batch,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
    }

    const data: OpenRouterEmbeddingResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error("No embeddings returned from API");
    }

    // Sort by index to maintain order
    const sortedData = data.data.sort((a, b) => a.index - b.index);

    for (const item of sortedData) {
      allEmbeddings.push(item.embedding);
    }

    totalInputTokens += data.usage.prompt_tokens;
    usedModel = data.model;
  }

  return {
    embeddings: allEmbeddings,
    model: usedModel,
    totalInputTokens,
  };
}

export const batchEmbeddingsTool = tool(
  async (input): Promise<ToolResult<BatchEmbeddingResult>> => {
    const startTime = Date.now();
    try {
      const result = await batchEmbeddingsRaw(input.texts, input.model);

      return wrapToolSuccess(result, startTime, { source: "openrouter" });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "batch_embeddings",
    description: `Generates embedding vectors for multiple texts in batches. More efficient than calling generate_embedding repeatedly.`,
    schema: BatchEmbeddingSchema,
  }
);

export const batchTools = [batchEmbeddingsTool];
