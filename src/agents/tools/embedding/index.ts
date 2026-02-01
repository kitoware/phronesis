import {
  generateEmbeddingTool,
  generateEmbeddingRaw,
  generateTools,
  DEFAULT_EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "./generate";

import { batchEmbeddingsTool, batchEmbeddingsRaw, batchTools } from "./batch";

import {
  cosineSimilarity,
  euclideanDistance,
  findMostSimilarVectors,
  cosineSimilarityTool,
  findMostSimilarTool,
  similarityTools,
} from "./similarity";

// Re-export all
export {
  generateEmbeddingTool,
  generateEmbeddingRaw,
  generateTools,
  DEFAULT_EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  batchEmbeddingsTool,
  batchEmbeddingsRaw,
  batchTools,
  cosineSimilarity,
  euclideanDistance,
  findMostSimilarVectors,
  cosineSimilarityTool,
  findMostSimilarTool,
  similarityTools,
};

// Aggregate all embedding tools
export const allEmbeddingTools = [
  ...generateTools,
  ...batchTools,
  ...similarityTools,
];
