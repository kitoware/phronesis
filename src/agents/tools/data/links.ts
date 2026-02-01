import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import { MatchTypeSchema, ReviewStatusSchema } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;

const CreateLinkSchema = z.object({
  problemId: z.string().describe("Convex ID of the startup problem"),
  paperId: z.string().describe("Convex ID of the research paper"),
  insightId: z.string().optional().describe("Convex ID of the insight"),
  relevanceScore: z
    .number()
    .min(0)
    .max(1)
    .describe("Relevance score between 0 and 1"),
  matchType: MatchTypeSchema.describe(
    "Type of match between problem and paper"
  ),
  matchRationale: z
    .string()
    .describe("Explanation of why this match is relevant"),
  keyInsights: z.array(z.string()).describe("Key insights from the paper"),
  applicationSuggestions: z
    .array(z.string())
    .describe("How to apply the research"),
  confidence: z.number().min(0).max(1).describe("Confidence in the match"),
});

export const createLinkTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(api.researchLinks.create, {
        problemId: input.problemId as AnyId,
        paperId: input.paperId as AnyId,
        insightId: input.insightId as AnyId,
        relevanceScore: input.relevanceScore,
        matchType: input.matchType,
        matchRationale: input.matchRationale,
        keyInsights: input.keyInsights,
        applicationSuggestions: input.applicationSuggestions,
        confidence: input.confidence,
      });
      return wrapToolSuccess({ id: String(id) }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "create_research_link",
    description:
      "Creates a link between a startup problem and a research paper",
    schema: CreateLinkSchema,
  }
);

export const getLinkTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const link = await client.query(api.researchLinks.getById, {
        id: input.id as AnyId,
      });
      if (!link) {
        return wrapToolError(
          new Error(`Link ${input.id} not found`),
          startTime
        );
      }
      return wrapToolSuccess(link, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_research_link",
    description: "Gets a research link by its Convex ID",
    schema: z.object({
      id: z.string().describe("Convex ID of the research link"),
    }),
  }
);

export const listLinksTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const links = await client.query(api.researchLinks.list, {
        reviewStatus: input.reviewStatus,
        limit: input.limit,
      });
      return wrapToolSuccess(links, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "list_research_links",
    description: "Lists research links with optional status filter",
    schema: z.object({
      reviewStatus: ReviewStatusSchema.optional().describe(
        "Filter by review status"
      ),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const getLinksByProblemTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const links = await client.query(api.researchLinks.getByProblem, {
        problemId: input.problemId as AnyId,
      });
      return wrapToolSuccess(links, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_links_by_problem",
    description: "Gets all research links for a specific problem",
    schema: z.object({
      problemId: z.string().describe("Convex ID of the problem"),
    }),
  }
);

export const updateLinkReviewTool = tool(
  async (input): Promise<ToolResult<{ success: boolean }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      await client.mutation(api.researchLinks.updateReview, {
        id: input.id as AnyId,
        reviewStatus: input.reviewStatus,
        reviewNotes: input.reviewNotes,
      });
      return wrapToolSuccess({ success: true }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "update_link_review",
    description: "Updates the review status of a research link",
    schema: z.object({
      id: z.string().describe("Convex ID of the research link"),
      reviewStatus: ReviewStatusSchema.describe("New review status"),
      reviewNotes: z.string().optional().describe("Notes from the reviewer"),
    }),
  }
);

export const linkTools = [
  createLinkTool,
  getLinkTool,
  listLinksTool,
  getLinksByProblemTool,
  updateLinkReviewTool,
];
