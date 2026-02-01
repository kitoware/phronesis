import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

const TAVILY_API_URL = "https://api.tavily.com";

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  score: number;
  publishedDate?: string;
}

interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string;
  responseTime: number;
}

function getTavilyApiKey(): string {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY environment variable is not set");
  }
  return apiKey;
}

const TavilySearchSchema = z.object({
  query: z.string().describe("The search query"),
  searchDepth: z
    .enum(["basic", "advanced"])
    .optional()
    .default("basic")
    .describe("Search depth: basic for quick, advanced for comprehensive"),
  maxResults: z.number().int().min(1).max(20).optional().default(5),
  includeDomains: z
    .array(z.string())
    .optional()
    .describe("Only include results from these domains"),
  excludeDomains: z
    .array(z.string())
    .optional()
    .describe("Exclude results from these domains"),
  includeAnswer: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to include an AI-generated answer"),
  includeRawContent: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to include raw HTML content"),
  topic: z
    .enum(["general", "news"])
    .optional()
    .default("general")
    .describe("Search topic category"),
  days: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("For news topic, limit to results from the past N days"),
});

export const tavilySearchTool = tool(
  async (input): Promise<ToolResult<TavilySearchResponse>> => {
    const startTime = Date.now();
    try {
      const apiKey = getTavilyApiKey();

      const requestBody: Record<string, unknown> = {
        api_key: apiKey,
        query: input.query,
        search_depth: input.searchDepth,
        max_results: input.maxResults,
        include_answer: input.includeAnswer,
        include_raw_content: input.includeRawContent,
        topic: input.topic,
      };

      if (input.includeDomains) {
        requestBody.include_domains = input.includeDomains;
      }
      if (input.excludeDomains) {
        requestBody.exclude_domains = input.excludeDomains;
      }
      if (input.days && input.topic === "news") {
        requestBody.days = input.days;
      }

      const response = await fetch(`${TAVILY_API_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      const result: TavilySearchResponse = {
        query: data.query,
        results: (data.results || []).map((r: Record<string, unknown>) => ({
          title: r.title as string,
          url: r.url as string,
          content: r.content as string,
          rawContent: r.raw_content as string | undefined,
          score: r.score as number,
          publishedDate: r.published_date as string | undefined,
        })),
        answer: data.answer,
        responseTime: data.response_time,
      };

      return wrapToolSuccess(result, startTime, { source: "tavily" });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "tavily_search",
    description:
      "Searches the web using Tavily AI, optimized for accuracy and relevance. Good fallback for Exa.",
    schema: TavilySearchSchema,
  }
);

export const tavilyTools = [tavilySearchTool];
