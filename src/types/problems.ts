import { Id } from "../../convex/_generated/dataModel";

export type ProblemCategory =
  | "technical"
  | "operational"
  | "market"
  | "product"
  | "scaling"
  | "other";

export type ProblemSeverity = "low" | "medium" | "high" | "critical";

export type ProblemStatus =
  | "identified"
  | "researching"
  | "solution-found"
  | "resolved"
  | "archived";

export interface ProblemEvidence {
  source: string;
  excerpt: string;
  date?: string;
  url?: string;
}

export interface StartupProblem {
  _id: Id<"startupProblems">;
  startupId: Id<"startups">;
  title: string;
  description: string;
  category: ProblemCategory;
  severity: ProblemSeverity;
  status: ProblemStatus;
  evidence: ProblemEvidence[];
  tags: string[];
  embedding: number[];
  discoveredAt: number;
  updatedAt: number;
}

export type MatchType = "direct" | "methodology" | "tangential" | "inspiration";

export type ReviewStatus = "pending" | "accepted" | "rejected" | "needs-review";

export interface ResearchLink {
  _id: Id<"researchLinks">;
  problemId: Id<"startupProblems">;
  paperId: Id<"papers">;
  insightId?: Id<"insights">;
  relevanceScore: number;
  matchType: MatchType;
  matchRationale: string;
  keyInsights: string[];
  applicationSuggestions: string[];
  confidence: number;
  createdAt: number;
  reviewedAt?: number;
  reviewStatus: ReviewStatus;
  reviewNotes?: string;
}

export type Priority = "low" | "medium" | "high";
export type Effort = "low" | "medium" | "high";

export interface Recommendation {
  title: string;
  description: string;
  priority: Priority;
  effort: Effort;
  relatedPapers: Id<"papers">[];
}

export interface ReportSection {
  title: string;
  content: string;
  citations: Id<"papers">[];
}

export type ReportStatus = "draft" | "published" | "archived";

export interface SolutionReport {
  _id: Id<"solutionReports">;
  problemId: Id<"startupProblems">;
  title: string;
  executiveSummary: string;
  sections: ReportSection[];
  recommendations: Recommendation[];
  linkedResearch: Id<"researchLinks">[];
  generatedAt: number;
  version: number;
  status: ReportStatus;
}
