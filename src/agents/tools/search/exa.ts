import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

const EXA_API_URL = "https://api.exa.ai";

interface ExaSearchResult {
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
  author?: string;
  score?: number;
}

interface ExaSearchResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
}

function getExaApiKey(): string {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY environment variable is not set");
  }
  return apiKey;
}

const ExaSearchSchema = z.object({
  query: z.string().describe("The search query"),
  numResults: z.number().int().min(1).max(100).optional().default(10),
  type: z
    .enum(["neural", "keyword", "auto"])
    .optional()
    .default("auto")
    .describe("Search type: neural for semantic, keyword for exact match"),
  useAutoprompt: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to use Exa's query enhancement"),
  includeDomains: z
    .array(z.string())
    .optional()
    .describe("Only include results from these domains"),
  excludeDomains: z
    .array(z.string())
    .optional()
    .describe("Exclude results from these domains"),
  startPublishedDate: z
    .string()
    .optional()
    .describe("Only include results published after this date (ISO format)"),
  endPublishedDate: z
    .string()
    .optional()
    .describe("Only include results published before this date (ISO format)"),
  category: z
    .enum([
      "company",
      "research paper",
      "news",
      "pdf",
      "github",
      "tweet",
      "personal site",
    ])
    .optional()
    .describe("Filter results by category"),
});

export const exaSearchTool = tool(
  async (input): Promise<ToolResult<ExaSearchResponse>> => {
    const startTime = Date.now();
    try {
      const apiKey = getExaApiKey();

      const requestBody: Record<string, unknown> = {
        query: input.query,
        numResults: input.numResults,
        type: input.type,
        useAutoprompt: input.useAutoprompt,
      };

      if (input.includeDomains) {
        requestBody.includeDomains = input.includeDomains;
      }
      if (input.excludeDomains) {
        requestBody.excludeDomains = input.excludeDomains;
      }
      if (input.startPublishedDate) {
        requestBody.startPublishedDate = input.startPublishedDate;
      }
      if (input.endPublishedDate) {
        requestBody.endPublishedDate = input.endPublishedDate;
      }
      if (input.category) {
        requestBody.category = input.category;
      }

      const response = await fetch(`${EXA_API_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Exa API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as ExaSearchResponse;
      return wrapToolSuccess(data, startTime, { source: "exa" });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "exa_search",
    description:
      "Performs a semantic web search using Exa AI to find relevant content",
    schema: ExaSearchSchema,
  }
);

const ExaFindSimilarSchema = z.object({
  url: z.string().url().describe("URL to find similar content for"),
  numResults: z.number().int().min(1).max(100).optional().default(10),
  includeDomains: z
    .array(z.string())
    .optional()
    .describe("Only include results from these domains"),
  excludeDomains: z
    .array(z.string())
    .optional()
    .describe("Exclude results from these domains"),
  excludeSourceDomain: z
    .boolean()
    .optional()
    .default(true)
    .describe("Exclude results from the same domain as the source URL"),
});

export const exaFindSimilarTool = tool(
  async (input): Promise<ToolResult<ExaSearchResponse>> => {
    const startTime = Date.now();
    try {
      const apiKey = getExaApiKey();

      const requestBody: Record<string, unknown> = {
        url: input.url,
        numResults: input.numResults,
        excludeSourceDomain: input.excludeSourceDomain,
      };

      if (input.includeDomains) {
        requestBody.includeDomains = input.includeDomains;
      }
      if (input.excludeDomains) {
        requestBody.excludeDomains = input.excludeDomains;
      }

      const response = await fetch(`${EXA_API_URL}/findSimilar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Exa API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as ExaSearchResponse;
      return wrapToolSuccess(data, startTime, { source: "exa" });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "exa_find_similar",
    description: "Finds web pages similar to a given URL using Exa AI",
    schema: ExaFindSimilarSchema,
  }
);

export const exaTools = [exaSearchTool, exaFindSimilarTool];
