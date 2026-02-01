import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import {
  ProblemCategorySchema,
  ProblemSeveritySchema,
  ProblemStatusSchema,
} from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;

const EvidenceSchema = z.object({
  source: z.string(),
  excerpt: z.string(),
  date: z.string().optional(),
  url: z.string().optional(),
});

const CreateProblemSchema = z.object({
  startupId: z.string().describe("Convex ID of the associated startup"),
  title: z.string().describe("Short title for the problem"),
  description: z.string().describe("Detailed description of the problem"),
  category: ProblemCategorySchema.describe("Problem category"),
  severity: ProblemSeveritySchema.describe("Severity level"),
  evidence: z.array(EvidenceSchema).describe("Supporting evidence"),
  tags: z.array(z.string()).describe("Tags for categorization"),
  embedding: z.array(z.number()).describe("1536-dimensional embedding vector"),
});

export const createProblemTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(api.problems.create, {
        startupId: input.startupId as AnyId,
        title: input.title,
        description: input.description,
        category: input.category,
        severity: input.severity,
        evidence: input.evidence,
        tags: input.tags,
        embedding: input.embedding,
      });
      return wrapToolSuccess({ id: String(id) }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "create_problem",
    description: "Creates a new startup problem record",
    schema: CreateProblemSchema,
  }
);

export const getProblemTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const problem = await client.query(api.problems.getById, {
        id: input.id as AnyId,
      });
      if (!problem) {
        return wrapToolError(
          new Error(`Problem ${input.id} not found`),
          startTime
        );
      }
      return wrapToolSuccess(problem, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_problem",
    description: "Gets a startup problem by its Convex ID",
    schema: z.object({
      id: z.string().describe("Convex ID of the problem"),
    }),
  }
);

export const listProblemsTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const problems = await client.query(api.problems.list, {
        startupId: input.startupId as AnyId,
        category: input.category,
        severity: input.severity,
        status: input.status,
        limit: input.limit,
      });
      return wrapToolSuccess(problems, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "list_problems",
    description: "Lists startup problems with optional filters",
    schema: z.object({
      startupId: z.string().optional().describe("Filter by startup ID"),
      category: ProblemCategorySchema.optional().describe("Filter by category"),
      severity: ProblemSeveritySchema.optional().describe("Filter by severity"),
      status: ProblemStatusSchema.optional().describe("Filter by status"),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const searchSimilarProblemsTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      // searchSimilar is an action, not a query
      const problems = await client.action(api.problems.searchSimilar, {
        embedding: input.embedding,
        category: input.category,
        severity: input.severity,
        limit: input.limit,
      });
      return wrapToolSuccess(problems, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "search_similar_problems",
    description:
      "Finds problems similar to the given embedding using vector search",
    schema: z.object({
      embedding: z
        .array(z.number())
        .describe("1536-dimensional query embedding"),
      category: ProblemCategorySchema.optional().describe("Filter by category"),
      severity: ProblemSeveritySchema.optional().describe("Filter by severity"),
      limit: z.number().int().min(1).max(50).optional().default(10),
    }),
  }
);

export const updateProblemStatusTool = tool(
  async (input): Promise<ToolResult<{ success: boolean }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      await client.mutation(api.problems.updateStatus, {
        id: input.id as AnyId,
        status: input.status,
      });
      return wrapToolSuccess({ success: true }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "update_problem_status",
    description: "Updates the status of a startup problem",
    schema: z.object({
      id: z.string().describe("Convex ID of the problem"),
      status: ProblemStatusSchema.describe("New status"),
    }),
  }
);

export const problemTools = [
  createProblemTool,
  getProblemTool,
  listProblemsTool,
  searchSimilarProblemsTool,
  updateProblemStatusTool,
];
