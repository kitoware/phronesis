export {
  researchAgentGraph,
  runResearchAgentGraph,
  streamResearchAgent,
} from "./graph";

export { ResearchAgentState, type ResearchAgentStateType } from "./state";

export type {
  ArxivPaper,
  ProcessedPaper,
  Insight,
  Diagram,
  AgentError,
  AgentProgress,
  AgentStatus,
} from "./types";

// Convenience function to run the research agent
export async function runResearchAgent(options?: {
  categories?: string[];
  maxPapers?: number;
  daysBack?: number;
}) {
  const { runResearchAgentGraph } = await import("./graph");

  console.log("Starting Research Discovery Agent...");
  console.log(
    `Categories: ${options?.categories?.join(", ") || "cs.AI, cs.LG, cs.CL"}`
  );
  console.log(`Max papers: ${options?.maxPapers || 10}`);
  console.log(`Days back: ${options?.daysBack || 7}`);

  const startTime = Date.now();

  const result = await runResearchAgentGraph({
    categories: options?.categories,
    maxPapers: options?.maxPapers,
    daysBack: options?.daysBack,
  });

  const duration = (Date.now() - startTime) / 1000;

  console.log("\n=== Research Agent Complete ===");
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log(`Papers fetched: ${result.fetchedPapers.length}`);
  console.log(`Papers processed: ${result.processedPapers.length}`);
  console.log(`Insights generated: ${result.insights.length}`);
  console.log(`Diagrams generated: ${result.diagrams.length}`);
  console.log(`Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    for (const error of result.errors) {
      console.log(`  - [${error.stage}] ${error.message}`);
    }
  }

  console.log(`\nSaved to database:`);
  console.log(`  - Papers: ${result.savedPaperIds.length}`);
  console.log(`  - Insights: ${result.savedInsightIds.length}`);
  console.log(`  - Diagrams: ${result.savedDiagramIds.length}`);

  return result;
}

// Run with streaming for progress updates
export async function runResearchAgentWithProgress(
  options?: {
    categories?: string[];
    maxPapers?: number;
    daysBack?: number;
  },
  onProgress?: (node: string, message: string) => void
) {
  const { streamResearchAgent } = await import("./graph");

  console.log("Starting Research Discovery Agent (streaming)...");

  let finalState: Partial<import("./state").ResearchAgentStateType> = {};

  for await (const { node, state } of streamResearchAgent({
    categories: options?.categories,
    maxPapers: options?.maxPapers,
    daysBack: options?.daysBack,
  })) {
    const message = state.progressMessage || `Completed ${node}`;

    if (onProgress) {
      onProgress(node, message);
    } else {
      console.log(`[${node}] ${message}`);
    }

    finalState = { ...finalState, ...state };
  }

  return finalState;
}
