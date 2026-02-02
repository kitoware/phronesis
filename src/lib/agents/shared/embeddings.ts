import { OpenAIEmbeddings } from "@langchain/openai";

/**
 * Creates an OpenAI embeddings client for generating 1536-dimension vectors.
 * Uses text-embedding-3-small to match existing schema.
 */
export function createEmbeddings() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  return new OpenAIEmbeddings({
    openAIApiKey: apiKey,
    modelName: "text-embedding-3-small",
    dimensions: 1536,
  });
}

/**
 * Generates an embedding for a given text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = createEmbeddings();
  return embeddings.embedQuery(text);
}
