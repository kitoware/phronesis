/**
 * Phronesis Agent Tools Registry
 *
 * A shared tool registry providing LangChain-compatible tools for all LangGraph agents.
 * Tools are organized by category and wrap Convex operations, external APIs, LLM calls,
 * PDF processing, embeddings, and caching.
 */

// Re-export types
export type {
  ToolResult,
  ToolMetadata,
  ToolCategory,
  CategorizedTool,
} from "./types";

export {
  PaginationSchema,
  SearchQuerySchema,
  IdSchema,
  PaperStatusSchema,
  CreatePaperSchema,
  ProblemCategorySchema,
  ProblemSeveritySchema,
  ProblemStatusSchema,
  FundingStageSchema,
  EmployeeCountSchema,
  MatchTypeSchema,
  ReviewStatusSchema,
  ChatMessageSchema,
  ChatCompletionSchema,
  EmbeddingInputSchema,
  BatchEmbeddingInputSchema,
  CacheKeySchema,
  CacheSetSchema,
  TaskPrioritySchema,
  TaskStatusSchema,
  ApprovalTypeSchema,
  ApprovalStatusSchema,
} from "./types";

// Re-export utilities
export {
  ToolError,
  ToolErrorCode,
  isRetryableError,
  wrapToolError,
  wrapToolSuccess,
  withRetry,
  createMetadata,
  withTiming,
  markCached,
  incrementRetries,
  withSource,
  OperationTimer,
  startTimer,
} from "./utils";

// Re-export data tools
export {
  getConvexClient,
  resetConvexClient,
  getApi,
  api,
  allDataTools,
  paperTools,
  insightTools,
  problemTools,
  startupTools,
  linkTools,
  reportTools,
  trendTools,
  taskTools,
  checkpointTools,
  approvalTools,
} from "./data";

// Re-export search tools
export {
  allSearchTools,
  exaTools,
  arxivTools,
  crunchbaseTools,
  tavilyTools,
  youtubeTools,
  exaSearchTool,
  exaFindSimilarTool,
  arxivSearchTool,
  arxivFetchByIdTool,
  crunchbaseSearchTool,
  crunchbaseGetDetailsTool,
  tavilySearchTool,
  youtubeTranscriptTool,
} from "./search";

// Re-export LLM tools
export {
  allLlmTools,
  chatTools,
  structuredTools,
  streamingTools,
  configureOpenRouter,
  getOpenRouterConfig,
  createChatCompletion,
  MODELS,
  chatCompletionTool,
  simpleCompletionTool,
  structuredOutputTool,
  PREDEFINED_SCHEMAS,
  streamingChatTool,
  streamChat,
} from "./llm";

// Re-export PDF tools
export {
  allPdfTools,
  downloadTools,
  extractTextTools,
  extractFigureTools,
  extractTableTools,
  extractRefTools,
  downloadPdfTool,
  downloadPdfBuffer,
  extractPdfTextTool,
  extractPdfTextFromBufferTool,
  extractPdfFiguresTool,
  extractPdfTablesTool,
  extractPdfRefsTool,
} from "./pdf";

// Re-export embedding tools
export {
  allEmbeddingTools,
  generateTools,
  batchTools,
  similarityTools,
  generateEmbeddingTool,
  generateEmbeddingRaw,
  batchEmbeddingsTool,
  batchEmbeddingsRaw,
  cosineSimilarityTool,
  findMostSimilarTool,
  cosineSimilarity,
  euclideanDistance,
  findMostSimilarVectors,
  DEFAULT_EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "./embedding";

// Re-export cache tools
export {
  allCacheTools,
  memoryCacheTools,
  convexCacheTools,
  memoryCacheGet,
  memoryCacheSet,
  memoryCacheDelete,
  memoryCacheClear,
  memoryCacheCleanup,
  memoryCacheSize,
  memoryCacheGetTool,
  memoryCacheSetTool,
  memoryCacheDeleteTool,
  memoryCacheClearTool,
  convexCacheGetTool,
  convexCacheSetTool,
  convexCacheDeleteTool,
  convexCacheCleanupTool,
  convexCacheClearNamespaceTool,
} from "./cache";

import type { ToolCategory, CategorizedTool } from "./types";
import { allDataTools } from "./data";
import { allSearchTools } from "./search";
import { allLlmTools } from "./llm";
import { allPdfTools } from "./pdf";
import { allEmbeddingTools } from "./embedding";
import { allCacheTools } from "./cache";

/**
 * Returns all available tools across all categories
 */
export function getAllTools(): unknown[] {
  return [
    ...allDataTools,
    ...allSearchTools,
    ...allLlmTools,
    ...allPdfTools,
    ...allEmbeddingTools,
    ...allCacheTools,
  ];
}

/**
 * Returns tools filtered by category
 */
export function getToolsByCategory(category: ToolCategory): unknown[] {
  switch (category) {
    case "data":
      return allDataTools;
    case "search":
      return allSearchTools;
    case "llm":
      return allLlmTools;
    case "pdf":
      return allPdfTools;
    case "embedding":
      return allEmbeddingTools;
    case "cache":
      return allCacheTools;
    default:
      return [];
  }
}

/**
 * Returns categorized tool information for all tools
 */
export function getCategorizedTools(): CategorizedTool[] {
  const tools: CategorizedTool[] = [];

  const addTools = (toolList: unknown[], category: ToolCategory) => {
    for (const t of toolList) {
      const toolObj = t as { name?: string; description?: string };
      tools.push({
        name: toolObj.name || "unknown",
        category,
        description: toolObj.description || "",
        tool: t,
      });
    }
  };

  addTools(allDataTools, "data");
  addTools(allSearchTools, "search");
  addTools(allLlmTools, "llm");
  addTools(allPdfTools, "pdf");
  addTools(allEmbeddingTools, "embedding");
  addTools(allCacheTools, "cache");

  return tools;
}

/**
 * Returns tool count by category
 */
export function getToolCounts(): Record<ToolCategory, number> {
  return {
    data: allDataTools.length,
    search: allSearchTools.length,
    llm: allLlmTools.length,
    pdf: allPdfTools.length,
    embedding: allEmbeddingTools.length,
    cache: allCacheTools.length,
  };
}

/**
 * Returns total number of tools
 */
export function getTotalToolCount(): number {
  return getAllTools().length;
}
