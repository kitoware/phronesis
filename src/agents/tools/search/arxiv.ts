import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

const ARXIV_API_URL = "https://export.arxiv.org/api/query";

interface ArxivAuthor {
  name: string;
  affiliations?: string[];
}

interface ArxivPaper {
  id: string;
  title: string;
  abstract: string;
  authors: ArxivAuthor[];
  categories: string[];
  primaryCategory: string;
  publishedDate: string;
  updatedDate?: string;
  pdfUrl: string;
  doi?: string;
  journalRef?: string;
  comments?: string;
}

interface ArxivSearchResponse {
  totalResults: number;
  startIndex: number;
  papers: ArxivPaper[];
}

function parseArxivXml(xml: string): ArxivPaper[] {
  const papers: ArxivPaper[] = [];

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const getId = (text: string): string => {
      const idMatch = text.match(/<id>([^<]+)<\/id>/);
      if (!idMatch) return "";
      const url = idMatch[1];
      const arxivId = url.split("/abs/")[1]?.replace(/v\d+$/, "") || "";
      return arxivId;
    };

    const getTagContent = (text: string, tag: string): string => {
      const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const tagMatch = text.match(regex);
      return tagMatch ? tagMatch[1].trim() : "";
    };

    const getAuthors = (text: string): ArxivAuthor[] => {
      const authors: ArxivAuthor[] = [];
      const authorRegex = /<author>([\s\S]*?)<\/author>/g;
      let authorMatch;

      while ((authorMatch = authorRegex.exec(text)) !== null) {
        const authorBlock = authorMatch[1];
        const name = getTagContent(authorBlock, "name");
        const affiliations: string[] = [];

        const affRegex = /<arxiv:affiliation>([^<]+)<\/arxiv:affiliation>/g;
        let affMatch;
        while ((affMatch = affRegex.exec(authorBlock)) !== null) {
          affiliations.push(affMatch[1].trim());
        }

        if (name) {
          authors.push({
            name,
            affiliations: affiliations.length > 0 ? affiliations : undefined,
          });
        }
      }

      return authors;
    };

    const getCategories = (text: string): string[] => {
      const categories: string[] = [];
      const catRegex = /<category[^>]*term="([^"]+)"[^>]*\/>/g;
      let catMatch;

      while ((catMatch = catRegex.exec(text)) !== null) {
        categories.push(catMatch[1]);
      }

      return categories;
    };

    const getPrimaryCategory = (text: string): string => {
      const primaryMatch = text.match(
        /<arxiv:primary_category[^>]*term="([^"]+)"[^>]*\/>/
      );
      return primaryMatch ? primaryMatch[1] : "";
    };

    const getPdfUrl = (text: string): string => {
      const pdfMatch = text.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"[^>]*\/>/);
      return pdfMatch ? pdfMatch[1] : "";
    };

    const id = getId(entry);
    const title = getTagContent(entry, "title").replace(/\s+/g, " ");
    const abstract = getTagContent(entry, "summary").replace(/\s+/g, " ");
    const authors = getAuthors(entry);
    const categories = getCategories(entry);
    const primaryCategory = getPrimaryCategory(entry);
    const publishedDate = getTagContent(entry, "published");
    const updatedDate = getTagContent(entry, "updated");
    const pdfUrl = getPdfUrl(entry);
    const doi = getTagContent(entry, "arxiv:doi") || undefined;
    const journalRef = getTagContent(entry, "arxiv:journal_ref") || undefined;
    const comments = getTagContent(entry, "arxiv:comment") || undefined;

    if (id && title) {
      papers.push({
        id,
        title,
        abstract,
        authors,
        categories,
        primaryCategory,
        publishedDate,
        updatedDate: updatedDate || undefined,
        pdfUrl,
        doi,
        journalRef,
        comments,
      });
    }
  }

  return papers;
}

function getTotalResults(xml: string): number {
  const match = xml.match(
    /<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/
  );
  return match ? parseInt(match[1], 10) : 0;
}

function getStartIndex(xml: string): number {
  const match = xml.match(
    /<opensearch:startIndex[^>]*>(\d+)<\/opensearch:startIndex>/
  );
  return match ? parseInt(match[1], 10) : 0;
}

const ArxivSearchSchema = z.object({
  query: z.string().describe("Search query (supports arXiv search syntax)"),
  maxResults: z.number().int().min(1).max(100).optional().default(10),
  start: z.number().int().min(0).optional().default(0),
  sortBy: z
    .enum(["relevance", "lastUpdatedDate", "submittedDate"])
    .optional()
    .default("relevance"),
  sortOrder: z.enum(["ascending", "descending"]).optional().default("descending"),
  categories: z
    .array(z.string())
    .optional()
    .describe("Filter by arXiv categories (e.g., ['cs.AI', 'cs.LG'])"),
});

export const arxivSearchTool = tool(
  async (input): Promise<ToolResult<ArxivSearchResponse>> => {
    const startTime = Date.now();
    try {
      let searchQuery = input.query;

      if (input.categories && input.categories.length > 0) {
        const categoryFilter = input.categories
          .map((cat) => `cat:${cat}`)
          .join("+OR+");
        searchQuery = `(${searchQuery})+AND+(${categoryFilter})`;
      }

      const params = new URLSearchParams({
        search_query: searchQuery,
        max_results: String(input.maxResults),
        start: String(input.start),
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      });

      const response = await fetch(`${ARXIV_API_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
      }

      const xml = await response.text();
      const papers = parseArxivXml(xml);
      const totalResults = getTotalResults(xml);
      const startIndex = getStartIndex(xml);

      return wrapToolSuccess(
        {
          totalResults,
          startIndex,
          papers,
        },
        startTime,
        { source: "arxiv" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "arxiv_search",
    description:
      "Searches arXiv for academic papers. Supports full arXiv query syntax.",
    schema: ArxivSearchSchema,
  }
);

const ArxivFetchByIdSchema = z.object({
  arxivId: z
    .string()
    .describe("The arXiv ID (e.g., '2301.01234' or '2301.01234v2')"),
});

export const arxivFetchByIdTool = tool(
  async (input): Promise<ToolResult<ArxivPaper | null>> => {
    const startTime = Date.now();
    try {
      const params = new URLSearchParams({
        id_list: input.arxivId,
      });

      const response = await fetch(`${ARXIV_API_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
      }

      const xml = await response.text();
      const papers = parseArxivXml(xml);

      return wrapToolSuccess(papers[0] || null, startTime, { source: "arxiv" });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "arxiv_fetch_by_id",
    description: "Fetches a specific arXiv paper by its ID",
    schema: ArxivFetchByIdSchema,
  }
);

export const arxivTools = [arxivSearchTool, arxivFetchByIdTool];
