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

export const ProblemSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

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
export const TaskPrioritySchema = z.enum(["low", "normal", "high", "critical"]);

export const TaskStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

// Approval schemas
export const ApprovalTypeSchema = z.enum([
  "action",
  "output",
  "decision",
  "escalation",
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
export type ApprovalType = z.infer<typeof ApprovalTypeSchema>;
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;
