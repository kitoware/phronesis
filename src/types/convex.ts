/**
 * Type definitions for Convex query results.
 * These are simplified types for use until `npx convex dev` generates the full types.
 */

export interface ConvexPaper {
  _id: string;
  arxivId: string;
  title: string;
  abstract: string;
  authors: Array<{ name: string; affiliations?: string[] }>;
  categories: string[];
  primaryCategory: string;
  publishedDate: string;
  updatedDate?: string;
  pdfUrl: string;
  doi?: string;
  journalRef?: string;
  comments?: string;
  processingStatus: "pending" | "processing" | "completed" | "failed";
  processingError?: string;
  fetchedAt: number;
  processedAt?: number;
}

export interface ConvexInsight {
  _id: string;
  paperId: string;
  summary: string;
  keyFindings: string[];
  methodology: string;
  limitations: string[];
  futureWork: string[];
  technicalContributions: Array<{
    type: string;
    description: string;
    significance: "incremental" | "notable" | "significant" | "breakthrough";
  }>;
  practicalApplications: string[];
  targetAudience: string[];
  prerequisites: string[];
  embedding: number[];
  analysisVersion: string;
  analyzedAt: number;
}

export interface ConvexTrend {
  _id: string;
  category: string;
  topic: string;
  period: "daily" | "weekly" | "monthly" | "quarterly";
  startDate: string;
  endDate: string;
  metrics: {
    paperCount: number;
    citationVelocity?: number;
    authorCount: number;
    institutionCount: number;
    growthRate?: number;
  };
  timeSeries: Array<{ date: string; value: number }>;
  topPapers: string[];
  topAuthors: string[];
  relatedTopics: string[];
  forecast?: {
    nextPeriodEstimate: number;
    confidence: number;
    trend: "rising" | "stable" | "declining";
  };
  computedAt: number;
}

export interface ConvexStartup {
  _id: string;
  name: string;
  description: string;
  website?: string;
  linkedinUrl?: string;
  crunchbaseUrl?: string;
  foundedYear?: number;
  headquartersLocation?: string;
  employeeCount?:
    | "1-10"
    | "11-50"
    | "51-200"
    | "201-500"
    | "501-1000"
    | "1000+";
  fundingStage?:
    | "pre-seed"
    | "seed"
    | "series-a"
    | "series-b"
    | "series-c"
    | "series-d+"
    | "public"
    | "acquired";
  totalFunding?: number;
  industries: string[];
  technologies: string[];
  sourceType: "manual" | "crunchbase" | "linkedin" | "other";
  sourceUrl?: string;
  lastUpdated: number;
  createdAt: number;
}

export interface ConvexProblem {
  _id: string;
  startupId: string;
  title: string;
  description: string;
  category:
    | "technical"
    | "operational"
    | "market"
    | "product"
    | "scaling"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  status:
    | "identified"
    | "researching"
    | "solution-found"
    | "resolved"
    | "archived";
  evidence: Array<{
    source: string;
    excerpt: string;
    date?: string;
    url?: string;
  }>;
  tags: string[];
  embedding: number[];
  discoveredAt: number;
  updatedAt: number;
}

export interface ConvexResearchLink {
  _id: string;
  problemId: string;
  paperId: string;
  insightId?: string;
  relevanceScore: number;
  matchType: "direct" | "methodology" | "tangential" | "inspiration";
  matchRationale: string;
  keyInsights: string[];
  applicationSuggestions: string[];
  confidence: number;
  createdAt: number;
  reviewedAt?: number;
  reviewStatus: "pending" | "accepted" | "rejected" | "needs-review";
  reviewNotes?: string;
}

export type AgentType =
  | "research-ingestion"
  | "insight-generation"
  | "trend-analysis"
  | "problem-discovery"
  | "research-linking"
  | "solution-synthesis";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export type TaskStatus =
  | "queued"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export type ApprovalCategory =
  | "content-publish"
  | "data-modification"
  | "external-api"
  | "resource-intensive"
  | "security-sensitive"
  | "other";

export type AgentRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "awaiting_approval";

export type TriggerType = "scheduled" | "manual" | "webhook" | "dependency";

export interface ConvexAgentRun {
  _id: string;
  agentType: AgentType;
  status: AgentRunStatus;
  triggeredBy: TriggerType;
  input?: unknown;
  output?: unknown;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metrics?: {
    duration: number;
    itemsProcessed: number;
    tokensUsed?: number;
    apiCalls?: number;
  };
  startedAt?: number;
  completedAt?: number;
  createdAt: number;
}

export interface ConvexAgentTask {
  _id: string;
  agentType: AgentType;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress?: number;
  agentRunId?: string;
  payload?: unknown;
  triggeredBy: TriggerType;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface ConvexAgentApproval {
  _id: string;
  requestId: string;
  agentTaskId?: string;
  agentRunId?: string;
  agentType: AgentType;
  title: string;
  description: string;
  category: ApprovalCategory;
  data?: unknown;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: number;
  reviewNotes?: string;
  priority: TaskPriority;
  expiresAt?: number;
  requestedAt: number;
}
