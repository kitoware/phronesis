import { StateGraph, START, END } from "@langchain/langgraph";
import { ProblemDiscoveryState } from "./state";
import {
  searchChannelsNode,
  syncStartupsNode,
  extractProblemsNode,
  detectImplicitNode,
  clusterProblemsNode,
  saveToDbNode,
} from "./nodes";

const builder = new StateGraph(ProblemDiscoveryState)
  .addNode("search_channels", searchChannelsNode)
  .addNode("sync_startups", syncStartupsNode)
  .addNode("extract_problems", extractProblemsNode)
  .addNode("detect_implicit", detectImplicitNode)
  .addNode("cluster_problems", clusterProblemsNode)
  .addNode("save_to_db", saveToDbNode)
  .addEdge(START, "search_channels")
  .addEdge("search_channels", "sync_startups")
  .addEdge("sync_startups", "extract_problems")
  .addEdge("extract_problems", "detect_implicit")
  .addEdge("detect_implicit", "cluster_problems")
  .addEdge("cluster_problems", "save_to_db")
  .addEdge("save_to_db", END);

export const problemDiscoveryGraph = builder.compile();

export async function runProblemDiscovery(): Promise<{
  problems: number;
  signals: number;
  clusters: number;
  errors: number;
  duration: number;
}> {
  const initialState = {
    searchQueries: [],
    rawResults: [],
    extractedProblems: [],
    implicitSignals: [],
    clusteredProblems: [],
    savedProblems: [],
    savedSignals: [],
    savedClusters: [],
    errors: [],
    status: "idle" as const,
    progress: { current: 0, total: 6, stage: "Initializing" },
    metrics: {
      startTime: Date.now(),
      searchQueries: 0,
      rawResults: 0,
      extractedProblems: 0,
      implicitSignals: 0,
      clusters: 0,
      apiCalls: 0,
      tokensUsed: 0,
    },
  };

  const finalState = await problemDiscoveryGraph.invoke(initialState);

  return {
    problems: finalState.savedProblems.length,
    signals: finalState.savedSignals.length,
    clusters: finalState.savedClusters.length,
    errors: finalState.errors.length,
    duration:
      (finalState.metrics.endTime ?? Date.now()) - finalState.metrics.startTime,
  };
}
