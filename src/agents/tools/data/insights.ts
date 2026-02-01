import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;

const SignificanceSchema = z.enum([
  "incremental",
  "notable",
  "significant",
  "breakthrough",
]);

const TechnicalContributionSchema = z.object({
  type: z.string(),
  description: z.string(),
  significance: SignificanceSchema,
});

const CreateInsightSchema = z.object({
  paperId: z.string().describe("Convex ID of the associated paper"),
  summary: z.string().describe("Executive summary of the paper"),
  keyFindings: z.array(z.string()).describe("List of key findings"),
  methodology: z.string().describe("Description of methodology used"),
  limitations: z.array(z.string()).describe("Known limitations"),
  futureWork: z.array(z.string()).describe("Suggested future work directions"),
  technicalContributions: z
    .array(TechnicalContributionSchema)
    .describe("Technical contributions with significance levels"),
  practicalApplications: z.array(z.string()).describe("Practical applications"),
  targetAudience: z.array(z.string()).describe("Target audience for the paper"),
  prerequisites: z
    .array(z.string())
    .describe("Prerequisites for understanding"),
  embedding: z.array(z.number()).describe("1536-dimensional embedding vector"),
});

export const createInsightTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(api.insights.create, {
        paperId: input.paperId as AnyId,
        summary: input.summary,
        keyFindings: input.keyFindings,
        methodology: input.methodology,
        limitations: input.limitations,
        futureWork: input.futureWork,
        technicalContributions: input.technicalContributions,
        practicalApplications: input.practicalApplications,
        targetAudience: input.targetAudience,
        prerequisites: input.prerequisites,
        embedding: input.embedding,
        analysisVersion: "1.0",
      });
      return wrapToolSuccess({ id: String(id) }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "create_insight",
    description: "Creates an insight analysis for a paper",
    schema: CreateInsightSchema,
  }
);

export const getInsightByPaperTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const insight = await client.query(api.insights.getByPaperId, {
        paperId: input.paperId as AnyId,
      });
      return wrapToolSuccess(insight, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_insight_by_paper",
    description: "Gets the insight analysis for a specific paper",
    schema: z.object({
      paperId: z.string().describe("Convex ID of the paper"),
    }),
  }
);

export const listInsightsTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const insights = await client.query(api.insights.list, {
        limit: input.limit,
      });
      return wrapToolSuccess(insights, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "list_insights",
    description: "Lists all insights with optional limit",
    schema: z.object({
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const searchSimilarInsightsTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      // searchSimilar is an action, not a query
      const insights = await client.action(api.insights.searchSimilar, {
        embedding: input.embedding,
        limit: input.limit,
      });
      return wrapToolSuccess(insights, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "search_similar_insights",
    description:
      "Finds insights similar to the given embedding using vector search",
    schema: z.object({
      embedding: z
        .array(z.number())
        .describe("1536-dimensional query embedding"),
      limit: z.number().int().min(1).max(50).optional().default(10),
    }),
  }
);

export const insightTools = [
  createInsightTool,
  getInsightByPaperTool,
  listInsightsTool,
  searchSimilarInsightsTool,
];
