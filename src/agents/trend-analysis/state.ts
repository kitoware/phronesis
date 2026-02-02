/**
 * LangGraph State Schema for Trend Analysis Agent
 * Defines the state shape using LangGraph Annotations
 */

import { Annotation } from "@langchain/langgraph";
import type {
  Paper,
  TrendSignals,
  TrendMetrics,
  ClassifiedTrend,
  TrendForecast,
  ErrorInfo,
  ProcessingStatus,
  Progress,
} from "../tools/types";

/**
 * TrendAnalysisState - The complete state for the trend analysis graph
 *
 * This state flows through all nodes:
 * 1. load_papers: Populates papers and previousPeriodPapers
 * 2. extract_signals: Populates signals
 * 3. compute_metrics: Populates metrics
 * 4. classify_trends: Populates trends
 * 5. generate_forecast: Populates forecasts
 * 6. save_trends: Populates savedTrendIds
 */
export const TrendAnalysisState = Annotation.Root({
  // Input parameters
  category: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "cs.AI",
  }),

  period: Annotation<"daily" | "weekly" | "monthly">({
    reducer: (_, update) => update,
    default: () => "weekly" as const,
  }),

  // Loaded papers
  papers: Annotation<Paper[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),

  previousPeriodPapers: Annotation<Paper[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),

  // Extracted signals
  signals: Annotation<TrendSignals | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Computed metrics
  metrics: Annotation<TrendMetrics | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Classified trends
  trends: Annotation<ClassifiedTrend[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),

  // Forecasts (accumulates across runs)
  forecasts: Annotation<TrendForecast[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Saved trend IDs (accumulates)
  savedTrendIds: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Processing status
  status: Annotation<ProcessingStatus>({
    reducer: (_, update) => update,
    default: () => "idle" as ProcessingStatus,
  }),

  // Progress tracking
  progress: Annotation<Progress>({
    reducer: (_, update) => update,
    default: () => ({
      currentNode: "start",
      papersLoaded: 0,
      signalsExtracted: 0,
      trendsClassified: 0,
      forecastsGenerated: 0,
    }),
  }),

  // Error tracking (accumulates)
  errors: Annotation<ErrorInfo[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
});

// Export the state type for use in nodes
export type TrendAnalysisStateType = typeof TrendAnalysisState.State;
