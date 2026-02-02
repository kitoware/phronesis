import type { Id } from "../../../convex/_generated/dataModel";

export interface SearchQuery {
  query: string;
  type: "explicit" | "implicit" | "reviews" | "hiring" | "founder";
  domains?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export type Platform =
  | "reddit"
  | "twitter"
  | "hackernews"
  | "github"
  | "g2"
  | "stackoverflow"
  | "linkedin"
  | "producthunt"
  | "unknown";

export interface SearchResult {
  url: string;
  title: string;
  text: string;
  highlights?: string[];
  platform: Platform;
  score?: number;
  publishedDate?: string;
  author?: string;
}

export type ProblemCategory =
  | "technical"
  | "operational"
  | "market"
  | "product"
  | "scaling"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";

export interface Evidence {
  source: string;
  excerpt: string;
  date?: string;
  url?: string;
}

export interface Problem {
  statement: string;
  description: string;
  category: ProblemCategory;
  severity: Severity;
  frequency?: "rare" | "occasional" | "common" | "ubiquitous";
  urgency?: "low" | "medium" | "high";
  evidence: Evidence[];
  tags: string[];
  confidence: number;
  sourceUrl?: string;
  startupId?: Id<"startups">;
}

export type ImplicitSignalType =
  | "build_vs_buy"
  | "excessive_hiring"
  | "workaround_sharing"
  | "migration_announcement"
  | "open_source_creation"
  | "integration_complaint"
  | "scale_breakpoint"
  | "manual_process";

export interface ImplicitSignal {
  signalType: ImplicitSignalType;
  inferredProblem: string;
  confidence: number;
  evidence: {
    source: string;
    excerpt: string;
    url: string;
  };
  keywords: string[];
  startupId?: Id<"startups">;
}

export interface ProblemCluster {
  theme: string;
  description: string;
  problemIds: string[];
  size: number;
  industries: string[];
  fundingStages: string[];
  growthRate: number;
}

export interface ErrorInfo {
  node: string;
  error: string;
  recoverable: boolean;
  timestamp: number;
}

export type ProcessingStatus =
  | "idle"
  | "searching"
  | "syncing"
  | "extracting"
  | "detecting"
  | "clustering"
  | "saving"
  | "complete"
  | "failed";

export interface Progress {
  current: number;
  total: number;
  stage: string;
}

export interface SavedProblem {
  id: Id<"startupProblems">;
  title: string;
}

export interface SavedSignal {
  id: Id<"implicitSignals">;
  signalType: ImplicitSignalType;
}

export interface SavedCluster {
  id: Id<"problemClusters">;
  theme: string;
}

export interface AgentMetrics {
  startTime: number;
  endTime?: number;
  searchQueries: number;
  rawResults: number;
  extractedProblems: number;
  implicitSignals: number;
  clusters: number;
  apiCalls: number;
  tokensUsed: number;
}

export function mapSeverityFromScore(score: number): Severity {
  if (score <= 3) return "low";
  if (score <= 5) return "medium";
  if (score <= 8) return "high";
  return "critical";
}

export function mapSignalTypeToSchema(
  signalType: ImplicitSignalType
):
  | "job-posting"
  | "blog-post"
  | "social-media"
  | "press-release"
  | "funding-announcement"
  | "partnership"
  | "product-update"
  | "other" {
  const mapping: Record<
    ImplicitSignalType,
    | "job-posting"
    | "blog-post"
    | "social-media"
    | "press-release"
    | "funding-announcement"
    | "partnership"
    | "product-update"
    | "other"
  > = {
    build_vs_buy: "other",
    excessive_hiring: "job-posting",
    workaround_sharing: "blog-post",
    migration_announcement: "press-release",
    open_source_creation: "product-update",
    integration_complaint: "social-media",
    scale_breakpoint: "other",
    manual_process: "blog-post",
  };
  return mapping[signalType];
}

export function detectPlatform(url: string): Platform {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("reddit.com")) return "reddit";
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com"))
    return "twitter";
  if (urlLower.includes("news.ycombinator.com")) return "hackernews";
  if (urlLower.includes("github.com")) return "github";
  if (urlLower.includes("g2.com")) return "g2";
  if (urlLower.includes("stackoverflow.com")) return "stackoverflow";
  if (urlLower.includes("linkedin.com")) return "linkedin";
  if (urlLower.includes("producthunt.com")) return "producthunt";

  return "unknown";
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    let normalized = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    normalized = normalized.replace(/\/+$/, "");
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}
