import { StateGraph, END, START } from "@langchain/langgraph";
import { ResearchLinkingState, type ResearchLinkingStateType } from "./state";
import {
  loadProblem,
  findCandidates,
  scoreMatches,
  saveLinks,
  generateReport,
} from "./nodes";

/**
 * Creates the Research-Linking agent graph.
 *
 * Flow:
 * START → load_problem → find_candidates → score_matches → save_links
 *   ├─ [if needsApproval] → END (awaits human review)
 *   └─ [else] → generate_report → END
 */
export function createResearchLinkingGraph() {
  const graph = new StateGraph(ResearchLinkingState)
    .addNode("load_problem", loadProblem)
    .addNode("find_candidates", findCandidates)
    .addNode("score_matches", scoreMatches)
    .addNode("save_links", saveLinks)
    .addNode("generate_report", generateReport)
    .addEdge(START, "load_problem")
    .addEdge("load_problem", "find_candidates")
    .addEdge("find_candidates", "score_matches")
    .addEdge("score_matches", "save_links")
    .addConditionalEdges("save_links", (state: ResearchLinkingStateType) => {
      // If there's an error, go to END
      if (state.error) {
        return END;
      }
      // If needs approval, stop here for human review
      if (state.needsApproval) {
        return END;
      }
      // Otherwise continue to report generation
      return "generate_report";
    })
    .addEdge("generate_report", END);

  return graph.compile();
}

/**
 * Creates the report generation graph for resuming after approval.
 * This is a simpler graph that just generates the report.
 */
export function createReportGenerationGraph() {
  const graph = new StateGraph(ResearchLinkingState)
    .addNode("generate_report", generateReport)
    .addEdge(START, "generate_report")
    .addEdge("generate_report", END);

  return graph.compile();
}

export type ResearchLinkingGraph = ReturnType<
  typeof createResearchLinkingGraph
>;
export type ReportGenerationGraph = ReturnType<
  typeof createReportGenerationGraph
>;
