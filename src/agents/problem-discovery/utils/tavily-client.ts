export interface TavilySearchParams {
  query: string;
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  includeDomains?: string[];
  excludeDomains?: string[];
  includeAnswer?: boolean;
  includeRawContent?: boolean;
}

export interface TavilySearchResult {
  url: string;
  title: string;
  content: string;
  rawContent?: string;
  score: number;
  publishedDate?: string;
}

export interface TavilySearchResponse {
  results: TavilySearchResult[];
  answer?: string;
  query: string;
}

export async function tavilySearch(
  params: TavilySearchParams
): Promise<TavilySearchResponse> {
  const {
    query,
    maxResults = 10,
    searchDepth = "advanced",
    includeDomains,
    excludeDomains,
    includeAnswer = false,
    includeRawContent = false,
  } = params;

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY not configured");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_domains: includeDomains,
      exclude_domains: excludeDomains,
      include_answer: includeAnswer,
      include_raw_content: includeRawContent,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    results: data.results.map(
      (r: {
        url: string;
        title: string;
        content: string;
        raw_content?: string;
        score: number;
        published_date?: string;
      }) => ({
        url: r.url,
        title: r.title,
        content: r.content,
        rawContent: r.raw_content,
        score: r.score,
        publishedDate: r.published_date,
      })
    ),
    answer: data.answer,
    query: data.query,
  };
}
