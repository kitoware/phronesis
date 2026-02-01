import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

interface SimilarItem {
  index: number;
  score: number;
}

interface FindMostSimilarResult {
  matches: SimilarItem[];
  queryVector: number[];
}

/**
 * Computes cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Computes euclidean distance between two vectors
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Finds the most similar vectors from a corpus
 */
export function findMostSimilarVectors(
  query: number[],
  corpus: number[][],
  topK: number = 10,
  minScore: number = 0
): SimilarItem[] {
  const scores: SimilarItem[] = [];

  for (let i = 0; i < corpus.length; i++) {
    const score = cosineSimilarity(query, corpus[i]);
    if (score >= minScore) {
      scores.push({ index: i, score });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, topK);
}

const CosineSimilaritySchema = z.object({
  vectorA: z.array(z.number()).describe("First embedding vector"),
  vectorB: z.array(z.number()).describe("Second embedding vector"),
});

export const cosineSimilarityTool = tool(
  async (input): Promise<ToolResult<{ similarity: number }>> => {
    const startTime = Date.now();
    try {
      const similarity = cosineSimilarity(input.vectorA, input.vectorB);

      return wrapToolSuccess({ similarity }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "cosine_similarity",
    description:
      "Computes the cosine similarity between two embedding vectors. Returns a value between -1 and 1.",
    schema: CosineSimilaritySchema,
  }
);

const FindMostSimilarSchema = z.object({
  query: z.array(z.number()).describe("Query embedding vector"),
  corpus: z
    .array(z.array(z.number()))
    .describe("Array of embedding vectors to search"),
  topK: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .describe("Number of results to return"),
  minScore: z
    .number()
    .min(-1)
    .max(1)
    .optional()
    .default(0)
    .describe("Minimum similarity score threshold"),
});

export const findMostSimilarTool = tool(
  async (input): Promise<ToolResult<FindMostSimilarResult>> => {
    const startTime = Date.now();
    try {
      const matches = findMostSimilarVectors(
        input.query,
        input.corpus,
        input.topK,
        input.minScore
      );

      return wrapToolSuccess(
        {
          matches,
          queryVector: input.query,
        },
        startTime
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "find_most_similar",
    description:
      "Finds the most similar vectors from a corpus using cosine similarity. Returns indices and scores.",
    schema: FindMostSimilarSchema,
  }
);

export const similarityTools = [cosineSimilarityTool, findMostSimilarTool];
