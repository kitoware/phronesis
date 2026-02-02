import { OpenAIEmbeddings } from "@langchain/openai";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Create embeddings client using OpenRouter
export function createEmbeddingsClient(): OpenAIEmbeddings {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  return new OpenAIEmbeddings({
    modelName: "openai/text-embedding-3-small",
    configuration: {
      baseURL: OPENROUTER_BASE_URL,
    },
    apiKey: OPENROUTER_API_KEY,
    dimensions: 1536,
  });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = createEmbeddingsClient();
  const embedding = await client.embedQuery(text);
  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const client = createEmbeddingsClient();
  const embeddings = await client.embedDocuments(texts);
  return embeddings;
}

export function buildEmbeddingText(
  title: string,
  abstract: string,
  summary?: string,
  keyFindings?: string[]
): string {
  let text = `${title}\n\n${abstract}`;

  if (summary) {
    text += `\n\nSummary: ${summary}`;
  }

  if (keyFindings && keyFindings.length > 0) {
    text += `\n\nKey Findings:\n${keyFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}`;
  }

  return text;
}
