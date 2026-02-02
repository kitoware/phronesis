import type { ResearchAgentStateType } from "../state";
import { generateEmbeddings, buildEmbeddingText } from "../tools/embedding";
import type { Insight, AgentError, ProcessedPaper } from "../types";

export async function generateEmbeddingsNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { processedPapers, insights } = state;
  const errors: AgentError[] = [];
  const updatedInsights: Insight[] = [];

  // Build embedding texts for all papers
  const embeddingTexts = processedPapers.map(
    (paper: ProcessedPaper, index: number) => {
      const insight = insights[index];
      return buildEmbeddingText(
        paper.title,
        paper.abstract,
        insight?.summary,
        insight?.keyFindings
      );
    }
  );

  try {
    // Generate embeddings in batch
    const embeddings = await generateEmbeddings(embeddingTexts);

    // Update insights with embeddings
    for (let i = 0; i < insights.length; i++) {
      updatedInsights.push({
        ...insights[i],
        embedding: embeddings[i] || [],
      });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error generating embeddings";

    errors.push({
      stage: "generate-embeddings",
      message: `Batch embedding generation failed: ${errorMessage}`,
      timestamp: Date.now(),
    });

    // Fall back to individual generation
    for (let i = 0; i < insights.length; i++) {
      try {
        const singleEmbedding = await generateEmbeddings([embeddingTexts[i]]);
        updatedInsights.push({
          ...insights[i],
          embedding: singleEmbedding[0] || [],
        });
      } catch (singleError) {
        errors.push({
          stage: "generate-embeddings",
          message: `Failed to generate embedding for paper ${i}: ${singleError instanceof Error ? singleError.message : "Unknown error"}`,
          paperId: processedPapers[i]?.arxivId,
          timestamp: Date.now(),
        });

        // Keep insight without embedding
        updatedInsights.push({
          ...insights[i],
          embedding: [],
        });
      }
    }
  }

  const successCount = updatedInsights.filter(
    (i) => i.embedding.length > 0
  ).length;

  return {
    insights: updatedInsights,
    errors,
    status: "embedding",
    progressMessage: `Generated embeddings for ${successCount}/${insights.length} papers`,
  };
}
