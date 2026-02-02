/**
 * LangGraph StateGraph for Trend Analysis Agent
 * Defines the graph structure and edges between nodes
 */

import { StateGraph, START, END } from "@langchain/langgraph";
import { ConvexHttpClient } from "convex/browser";
import { TrendAnalysisState } from "./state";
import { ConvexCheckpointer } from "../checkpointer/convex";

// Import nodes
import { loadPapersNode } from "./nodes/load-papers";
import { extractSignalsNode } from "./nodes/extract-signals";
import { computeMetricsNode } from "./nodes/compute-metrics";
import { classifyTrendsNode } from "./nodes/classify-trends";
import { generateForecastNode } from "./nodes/generate-forecast";
import { saveTrendsNode } from "./nodes/save-trends";

/**
 * Build the trend analysis StateGraph
 *
 * Flow:
 * START -> load_papers -> extract_signals -> compute_metrics
 *       -> classify_trends -> generate_forecast -> save_trends -> END
 */
const builder = new StateGraph(TrendAnalysisState)
  // Add all nodes
  .addNode("load_papers", loadPapersNode)
  .addNode("extract_signals", extractSignalsNode)
  .addNode("compute_metrics", computeMetricsNode)
  .addNode("classify_trends", classifyTrendsNode)
  .addNode("generate_forecast", generateForecastNode)
  .addNode("save_trends", saveTrendsNode)

  // Define edges (sequential flow)
  .addEdge(START, "load_papers")
  .addEdge("load_papers", "extract_signals")
  .addEdge("extract_signals", "compute_metrics")
  .addEdge("compute_metrics", "classify_trends")
  .addEdge("classify_trends", "generate_forecast")
  .addEdge("generate_forecast", "save_trends")
  .addEdge("save_trends", END);

/**
 * Create a trend analysis graph with Convex checkpointing
 * @param convexClient - Optional Convex client for checkpointing
 */
export function createTrendAnalysisGraph(convexClient?: ConvexHttpClient) {
  const checkpointer = new ConvexCheckpointer(convexClient);

  return builder.compile({
    checkpointer,
  });
}

/**
 * Export compiled graph without checkpointing for direct use
 * Useful for testing or one-off runs
 */
export const trendAnalysisGraph = builder.compile();

/**
 * Graph type for type inference
 */
export type TrendAnalysisGraph = ReturnType<typeof createTrendAnalysisGraph>;
