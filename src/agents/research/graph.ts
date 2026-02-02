import { StateGraph, END } from "@langchain/langgraph";
import { ResearchAgentState, type ResearchAgentStateType } from "./state";
import { fetchArxivNode } from "./nodes/fetch-arxiv";
import { processPdfsNode } from "./nodes/process-pdfs";
import { analyzeLlmNode } from "./nodes/analyze-llm";
import { generateEmbeddingsNode } from "./nodes/generate-embeddings";
import { generateDiagramsNode } from "./nodes/generate-diagrams";
import { saveToDbNode } from "./nodes/save-to-db";

// Define the graph
const workflow = new StateGraph(ResearchAgentState)
  // Add nodes
  .addNode("fetch_arxiv", fetchArxivNode)
  .addNode("process_pdfs", processPdfsNode)
  .addNode("analyze_llm", analyzeLlmNode)
  .addNode("generate_embeddings", generateEmbeddingsNode)
  .addNode("generate_diagrams", generateDiagramsNode)
  .addNode("save_to_db", saveToDbNode)

  // Define edges
  .addEdge("__start__", "fetch_arxiv")
  .addEdge("fetch_arxiv", "process_pdfs")
  .addEdge("process_pdfs", "analyze_llm")
  .addEdge("analyze_llm", "generate_embeddings")
  .addEdge("generate_embeddings", "generate_diagrams")
  .addEdge("generate_diagrams", "save_to_db")
  .addEdge("save_to_db", END);

// Compile the graph
export const researchAgentGraph = workflow.compile();

// Type for the compiled graph
export type ResearchAgentGraph = typeof researchAgentGraph;

// Helper function to run the graph with custom input
export async function runResearchAgentGraph(
  input: Partial<ResearchAgentStateType> = {}
): Promise<ResearchAgentStateType> {
  const result = await researchAgentGraph.invoke({
    categories: input.categories || ["cs.AI", "cs.LG", "cs.CL"],
    maxPapers: input.maxPapers || 10,
    daysBack: input.daysBack || 7,
    ...input,
  });

  return result;
}

// Stream events for progress tracking
export async function* streamResearchAgent(
  input: Partial<ResearchAgentStateType> = {}
): AsyncGenerator<{
  node: string;
  state: Partial<ResearchAgentStateType>;
}> {
  const stream = await researchAgentGraph.stream(
    {
      categories: input.categories || ["cs.AI", "cs.LG", "cs.CL"],
      maxPapers: input.maxPapers || 10,
      daysBack: input.daysBack || 7,
      ...input,
    },
    { streamMode: "updates" }
  );

  for await (const event of stream) {
    // event is a record of node name to state updates
    for (const [nodeName, stateUpdate] of Object.entries(event)) {
      yield {
        node: nodeName,
        state: stateUpdate as Partial<ResearchAgentStateType>,
      };
    }
  }
}
