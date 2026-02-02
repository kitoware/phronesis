import Exa from "exa-js";

let exaClient: Exa | null = null;

function getExaClient(): Exa {
  if (!exaClient) {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      throw new Error("EXA_API_KEY not configured");
    }
    exaClient = new Exa(apiKey);
  }
  return exaClient;
}

export interface ExaSearchParams {
  query: string;
  type?: "neural" | "keyword" | "auto";
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  contents?: {
    text?: boolean | { maxCharacters?: number };
    highlights?: boolean | { numSentences?: number };
  };
}

export interface ExaSearchResult {
  url: string;
  title: string;
  text?: string;
  highlights?: string[];
  publishedDate?: string;
  author?: string;
  score?: number;
}

export interface ExaSearchResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
}

export async function exaSearch(
  params: ExaSearchParams
): Promise<ExaSearchResponse> {
  const {
    query,
    type = "neural",
    numResults = 50,
    includeDomains,
    excludeDomains,
    startPublishedDate,
    endPublishedDate,
    contents = { text: true, highlights: true },
  } = params;

  const exa = getExaClient();
  const response = await exa.searchAndContents(query, {
    type,
    numResults,
    includeDomains,
    excludeDomains,
    startPublishedDate,
    endPublishedDate,
    text: contents.text
      ? typeof contents.text === "object"
        ? contents.text
        : { maxCharacters: 2000 }
      : undefined,
    highlights: contents.highlights
      ? typeof contents.highlights === "object"
        ? contents.highlights
        : { numSentences: 5 }
      : undefined,
  });

  return {
    results: response.results.map((r) => ({
      url: r.url,
      title: r.title ?? "",
      text: (r as { text?: string }).text,
      highlights: (r as { highlights?: string[] }).highlights,
      publishedDate: r.publishedDate,
      author: r.author,
      score: r.score,
    })),
    autopromptString: (response as { autopromptString?: string })
      .autopromptString,
  };
}
