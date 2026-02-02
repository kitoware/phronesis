import type { ResearchAgentStateType } from "../state";
import { fetchArxivPapers } from "../tools/arxiv";
import type { ArxivPaper, AgentError } from "../types";

export async function fetchArxivNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { categories, maxPapers, daysBack } = state;
  const errors: AgentError[] = [];
  const fetchedPapers: ArxivPaper[] = [];

  try {
    const papers = await fetchArxivPapers({
      categories,
      maxResults: maxPapers,
      daysBack,
    });

    fetchedPapers.push(...papers);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error fetching papers";
    errors.push({
      stage: "fetch-arxiv",
      message: errorMessage,
      timestamp: Date.now(),
    });
  }

  return {
    fetchedPapers,
    errors,
    status: errors.length > 0 ? "failed" : "fetching",
    progressMessage: `Fetched ${fetchedPapers.length} papers from arXiv`,
  };
}
