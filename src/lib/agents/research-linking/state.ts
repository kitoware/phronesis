import { Annotation } from "@langchain/langgraph";
import type { Id, Doc } from "../shared/convex-client";
import type { CandidateMatch } from "./scoring";

/**
 * LangGraph state for the Research-Linking agent.
 * Uses Annotation.Root for proper state management with reducers.
 */
export const ResearchLinkingState = Annotation.Root({
  // Input
  problemId: Annotation<Id<"startupProblems">>(),
  runId: Annotation<Id<"agentRuns">>(),

  // Problem data (loaded from Convex)
  problem: Annotation<Doc<"startupProblems"> | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),

  // Candidate matches from vector search
  candidates: Annotation<CandidateMatch[]>({
    default: () => [],
    reducer: (_, next) => next,
  }),

  // Links created in Convex (with IDs)
  createdLinkIds: Annotation<Id<"researchLinks">[]>({
    default: () => [],
    reducer: (_, next) => next,
  }),

  // Whether human approval is required before generating report
  needsApproval: Annotation<boolean>({
    default: () => true,
    reducer: (_, next) => next,
  }),

  // Approved link IDs (populated after human review)
  approvedLinkIds: Annotation<Id<"researchLinks">[]>({
    default: () => [],
    reducer: (_, next) => next,
  }),

  // Generated report ID
  reportId: Annotation<Id<"solutionReports"> | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),

  // Error tracking
  error: Annotation<string | null>({
    default: () => null,
    reducer: (_, next) => next,
  }),
});

export type ResearchLinkingStateType = typeof ResearchLinkingState.State;

/**
 * Input for triggering the research-linking agent
 */
export interface ResearchLinkingInput {
  problemId: string;
}

/**
 * Output from the research-linking agent
 */
export interface ResearchLinkingOutput {
  runId: string;
  status: "awaiting-approval" | "completed" | "failed";
  linksCreated: number;
  reportId?: string;
  error?: string;
}

/**
 * Insight document with similarity score from vector search
 */
export interface InsightWithScore extends Doc<"insights"> {
  _score: number;
}

/**
 * Extended insight with paper data for scoring
 */
export interface InsightWithPaper {
  insight: InsightWithScore;
  paper: Doc<"papers">;
}
