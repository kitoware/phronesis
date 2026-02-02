import { z } from "zod";

/**
 * Metadata attached to every tool execution result
 */
export interface ToolMetadata {
  duration: number;
  cached: boolean;
  retries: number;
  timestamp?: number;
  source?: string;
}

/**
 * Standard result type for all tools
 */
export interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: ToolMetadata;
}

/**
 * Tool category for organization and filtering
 */
export type ToolCategory =
  | "data"
  | "search"
  | "llm"
  | "pdf"
  | "embedding"
  | "cache";

/**
 * Tool definition with category metadata
 */
export interface CategorizedTool {
  name: string;
  category: ToolCategory;
  description: string;
  tool: unknown;
}

// ============================================
// Zod Schemas for Tool Inputs
// ============================================

export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const IdSchema = z.object({
  id: z.string().min(1),
});

// Paper-related schemas
export const PaperStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const CreatePaperSchema = z.object({
  arxivId: z.string(),
  title: z.string(),
  abstract: z.string(),
  authors: z.array(
    z.object({
      name: z.string(),
      affiliations: z.array(z.string()).optional(),
    })
  ),
  categories: z.array(z.string()),
  primaryCategory: z.string(),
  publishedDate: z.string(),
  updatedDate: z.string().optional(),
  pdfUrl: z.string().url(),
  doi: z.string().optional(),
  journalRef: z.string().optional(),
  comments: z.string().optional(),
});

// Problem-related schemas
export const ProblemCategorySchema = z.enum([
  "technical",
  "operational",
  "market",
  "product",
  "scaling",
  "other",
]);

export const ProblemSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const ProblemStatusSchema = z.enum([
  "identified",
  "researching",
  "solution-found",
  "resolved",
  "archived",
]);

// Startup-related schemas
export const FundingStageSchema = z.enum([
  "pre-seed",
  "seed",
  "series-a",
  "series-b",
  "series-c",
  "series-d+",
  "public",
  "acquired",
]);

export const EmployeeCountSchema = z.enum([
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
]);

// Link-related schemas
export const MatchTypeSchema = z.enum([
  "direct",
  "methodology",
  "tangential",
  "inspiration",
]);

export const ReviewStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "needs-review",
]);

// LLM-related schemas
export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const ChatCompletionSchema = z.object({
  messages: z.array(ChatMessageSchema),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(128000).optional(),
});

// Embedding schemas
export const EmbeddingInputSchema = z.object({
  text: z.string().min(1),
  model: z.string().optional(),
});

export const BatchEmbeddingInputSchema = z.object({
  texts: z.array(z.string().min(1)).min(1).max(100),
  model: z.string().optional(),
});

// Cache schemas
export const CacheKeySchema = z.object({
  namespace: z.string().min(1),
  key: z.string().min(1),
});

export const CacheSetSchema = CacheKeySchema.extend({
  value: z.unknown(),
  ttlMs: z.number().int().positive().optional(),
});

// Task schemas
export const TaskPrioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const TaskStatusSchema = z.enum([
  "queued",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
]);

export const TriggerTypeSchema = z.enum([
  "scheduled",
  "manual",
  "webhook",
  "dependency",
]);

export const AgentTypeSchema = z.enum([
  "research-ingestion",
  "insight-generation",
  "trend-analysis",
  "problem-discovery",
  "research-linking",
  "solution-synthesis",
]);

// Approval schemas
export const ApprovalCategorySchema = z.enum([
  "content-publish",
  "data-modification",
  "external-api",
  "resource-intensive",
  "security-sensitive",
  "other",
]);

export const ApprovalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "expired",
]);

// Export types inferred from schemas
export type Pagination = z.infer<typeof PaginationSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type PaperStatus = z.infer<typeof PaperStatusSchema>;
export type CreatePaper = z.infer<typeof CreatePaperSchema>;
export type ProblemCategory = z.infer<typeof ProblemCategorySchema>;
export type ProblemSeverity = z.infer<typeof ProblemSeveritySchema>;
export type ProblemStatus = z.infer<typeof ProblemStatusSchema>;
export type FundingStage = z.infer<typeof FundingStageSchema>;
export type EmployeeCount = z.infer<typeof EmployeeCountSchema>;
export type MatchType = z.infer<typeof MatchTypeSchema>;
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatCompletion = z.infer<typeof ChatCompletionSchema>;
export type EmbeddingInput = z.infer<typeof EmbeddingInputSchema>;
export type BatchEmbeddingInput = z.infer<typeof BatchEmbeddingInputSchema>;
export type CacheKey = z.infer<typeof CacheKeySchema>;
export type CacheSet = z.infer<typeof CacheSetSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TriggerType = z.infer<typeof TriggerTypeSchema>;
export type AgentType = z.infer<typeof AgentTypeSchema>;
export type ApprovalCategory = z.infer<typeof ApprovalCategorySchema>;
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

// ============================================
// Trend Analysis Types (Plan 6)
// ============================================

// Paper types for trend analysis
export interface Paper {
  id: string;
  arxivId: string;
  title: string;
  abstract: string;
  authors: { name: string; affiliations?: string[] }[];
  categories: string[];
  primaryCategory: string;
  publishedDate: string;
  citationCount?: number;
  embedding?: number[];
}

// Trend signal types
export interface KeywordSignal {
  keyword: string;
  score: number;
  frequency: number;
  trend: "rising" | "stable" | "falling";
}

export interface TopicSignal {
  topicId: string;
  label: string;
  keywords: string[];
  paperCount: number;
  coherenceScore: number;
}

export interface EntitySignal {
  entity: string;
  type: "method" | "dataset" | "metric" | "model";
  frequency: number;
  papers: string[];
}

export interface TemporalBin {
  startDate: string;
  endDate: string;
  paperCount: number;
  avgCitations: number;
  topKeywords: string[];
}

export interface TrendSignals {
  keywords: KeywordSignal[];
  topics: TopicSignal[];
  entities: EntitySignal[];
  temporalBins: TemporalBin[];
}

// Trend metrics types
export interface TrendMetrics {
  paperCount: number;
  paperCountPrevPeriod: number;
  growthRate: number;
  momentum: number;
  authorCount: number;
  avgCitations: number;
  crossCategoryScore: number;
  trendScore: number;
}

// Trend classification types
export type TrendStatus =
  | "emerging"
  | "growing"
  | "stable"
  | "declining"
  | "breakthrough";

export interface ClassifiedTrend {
  id: string;
  name: string;
  description: string;
  status: TrendStatus;
  keywords: string[];
  categories: string[];
  metrics: TrendMetrics;
  timeSeries: { date: string; paperCount: number }[];
  topPapers: string[];
  relatedTrends: string[];
}

// Forecast types
export interface TrendForecast {
  trendId: string;
  direction: "up" | "down" | "stable";
  confidence: number;
  reasoning: string;
  predictedGrowthRate: number;
  timeHorizon: string;
}

// Error handling
export interface ErrorInfo {
  node: string;
  error: string;
  timestamp: Date;
  recoverable: boolean;
}

// Processing status
export type ProcessingStatus =
  | "idle"
  | "loading_papers"
  | "extracting_signals"
  | "computing_metrics"
  | "classifying"
  | "forecasting"
  | "saving"
  | "complete"
  | "failed";

// Progress tracking
export interface Progress {
  currentNode: string;
  papersLoaded: number;
  signalsExtracted: number;
  trendsClassified: number;
  forecastsGenerated: number;
}
