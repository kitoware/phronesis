const OPENAI_API_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const cleanedText = text.replace(/\n/g, " ").trim();

  if (!cleanedText) {
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: cleanedText,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI Embedding API error: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export async function batchGenerateEmbeddings(
  texts: string[],
  batchSize = 100
): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const cleanedTexts = texts.map((t) => t.replace(/\n/g, " ").trim());
  const results: number[][] = new Array(texts.length);

  for (let i = 0; i < cleanedTexts.length; i += batchSize) {
    const batch = cleanedTexts.slice(i, i + batchSize);
    const batchIndices: number[] = [];
    const nonEmptyTexts: string[] = [];

    batch.forEach((text, idx) => {
      if (text) {
        nonEmptyTexts.push(text);
        batchIndices.push(i + idx);
      } else {
        results[i + idx] = new Array(EMBEDDING_DIMENSIONS).fill(0);
      }
    });

    if (nonEmptyTexts.length === 0) {
      continue;
    }

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: nonEmptyTexts,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI Embedding API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    data.data.forEach((item: { embedding: number[]; index: number }) => {
      const originalIndex = batchIndices[item.index];
      results[originalIndex] = item.embedding;
    });

    if (i + batchSize < cleanedTexts.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}
