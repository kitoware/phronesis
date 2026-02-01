import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import { CreatePaperSchema, PaperStatusSchema } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;

export const createPaperTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(api.papers.create, input);
      return wrapToolSuccess({ id }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "create_paper",
    description: "Creates a new paper record in the database from ArXiv data",
    schema: CreatePaperSchema,
  }
);

export const getPaperTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const paper = await client.query(api.papers.getById, {
        id: input.id as AnyId,
      });
      if (!paper) {
        return wrapToolError(
          new Error(`Paper ${input.id} not found`),
          startTime
        );
      }
      return wrapToolSuccess(paper, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_paper",
    description: "Gets a paper by its Convex ID",
    schema: z.object({
      id: z.string().describe("The Convex document ID of the paper"),
    }),
  }
);

export const getPaperByArxivIdTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const paper = await client.query(api.papers.getByArxivId, {
        arxivId: input.arxivId,
      });
      if (!paper) {
        return wrapToolSuccess(null, startTime);
      }
      return wrapToolSuccess(paper, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_paper_by_arxiv_id",
    description: "Gets a paper by its ArXiv ID",
    schema: z.object({
      arxivId: z.string().describe("The ArXiv ID (e.g., '2301.01234')"),
    }),
  }
);

export const listPapersTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const papers = await client.query(api.papers.list, {
        status: input.status,
        category: input.category,
        limit: input.limit,
      });
      return wrapToolSuccess(papers, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "list_papers",
    description: "Lists papers with optional filtering by status and category",
    schema: z.object({
      status: PaperStatusSchema.optional().describe(
        "Filter by processing status"
      ),
      category: z.string().optional().describe("Filter by primary category"),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const searchPapersTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const papers = await client.query(api.papers.search, {
        searchTerm: input.query,
        category: input.category,
        limit: input.limit,
      });
      return wrapToolSuccess(papers, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "search_papers",
    description: "Searches papers by title using full-text search",
    schema: z.object({
      query: z.string().describe("Search query for paper titles"),
      category: z.string().optional().describe("Filter by primary category"),
      limit: z.number().int().min(1).max(50).optional().default(10),
    }),
  }
);

export const updatePaperStatusTool = tool(
  async (input): Promise<ToolResult<{ success: boolean }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      await client.mutation(api.papers.updateStatus, {
        id: input.id as AnyId,
        status: input.status,
        error: input.error,
      });
      return wrapToolSuccess({ success: true }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "update_paper_status",
    description: "Updates the processing status of a paper",
    schema: z.object({
      id: z.string().describe("The Convex document ID of the paper"),
      status: PaperStatusSchema.describe("New processing status"),
      error: z
        .string()
        .optional()
        .describe("Error message if status is 'failed'"),
    }),
  }
);

export const paperTools = [
  createPaperTool,
  getPaperTool,
  getPaperByArxivIdTool,
  listPapersTool,
  searchPapersTool,
  updatePaperStatusTool,
];
