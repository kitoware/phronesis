import type { ProblemDiscoveryStateType } from "../state";
import type { SearchQuery, SearchResult } from "../types";
import { detectPlatform } from "../types";
import { CONFIG, QUERY_TEMPLATES, DEFAULT_INDUSTRIES } from "../config";
import { exaSearch } from "../utils/exa-client";
import { tavilySearch } from "../utils/tavily-client";

function generateSearchQueries(industries: string[]): SearchQuery[] {
  const queries: SearchQuery[] = [];
  const dateRange = {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  };

  for (const industry of industries) {
    for (const [type, templates] of Object.entries(QUERY_TEMPLATES)) {
      for (const template of templates) {
        queries.push({
          query: template.replace("{industry}", industry),
          type: type as SearchQuery["type"],
          domains:
            type === "reviews"
              ? [...CONFIG.search.domains.reviews]
              : type === "hiring"
                ? [...CONFIG.search.domains.social]
                : undefined,
          dateRange,
        });
      }
    }
  }

  return queries;
}

async function executeSearch(
  query: SearchQuery
): Promise<{ results: SearchResult[]; apiCalls: number }> {
  try {
    const response = await exaSearch({
      query: query.query,
      type: "neural",
      numResults: CONFIG.search.resultsPerQuery,
      includeDomains: query.domains,
      startPublishedDate: query.dateRange?.start,
      endPublishedDate: query.dateRange?.end,
      contents: { text: true, highlights: true },
    });

    const results: SearchResult[] = response.results.map((r) => ({
      url: r.url,
      title: r.title,
      text: r.text ?? "",
      highlights: r.highlights,
      platform: detectPlatform(r.url),
      score: r.score,
      publishedDate: r.publishedDate,
      author: r.author,
    }));

    return { results, apiCalls: 1 };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("EXA_API_KEY")
    ) {
      try {
        const tavilyResponse = await tavilySearch({
          query: query.query,
          maxResults: Math.min(CONFIG.search.resultsPerQuery, 20),
          searchDepth: "advanced",
          includeDomains: query.domains,
        });

        const results: SearchResult[] = tavilyResponse.results.map((r) => ({
          url: r.url,
          title: r.title,
          text: r.content,
          highlights: r.rawContent ? [r.rawContent.slice(0, 500)] : undefined,
          platform: detectPlatform(r.url),
          score: r.score,
          publishedDate: r.publishedDate,
        }));

        return { results, apiCalls: 1 };
      } catch (tavilyError) {
        throw new Error(
          `Both Exa and Tavily failed: Exa: ${errorMessage}, Tavily: ${tavilyError instanceof Error ? tavilyError.message : String(tavilyError)}`
        );
      }
    }

    throw error;
  }
}

export async function searchChannelsNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  const queries = generateSearchQueries(DEFAULT_INDUSTRIES.slice(0, 5));
  const allResults: SearchResult[] = [];
  const errors: ProblemDiscoveryStateType["errors"] = [];
  let totalApiCalls = 0;

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];

    try {
      const { results, apiCalls } = await executeSearch(query);
      allResults.push(...results);
      totalApiCalls += apiCalls;

      if (i < queries.length - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.search.delayBetweenQueries)
        );
      }
    } catch (error) {
      errors.push({
        node: "search_channels",
        error: error instanceof Error ? error.message : String(error),
        recoverable: true,
        timestamp: Date.now(),
      });
    }
  }

  return {
    searchQueries: queries,
    rawResults: allResults,
    errors,
    status: "searching",
    progress: {
      current: 1,
      total: 6,
      stage: "Searching social channels",
    },
    metrics: {
      startTime: state.metrics.startTime,
      searchQueries: queries.length,
      rawResults: allResults.length,
      extractedProblems: 0,
      implicitSignals: 0,
      clusters: 0,
      apiCalls: totalApiCalls,
      tokensUsed: 0,
    },
  };
}
