import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;

const ReportStatusSchema = z.enum(["draft", "published", "archived"]);
const PrioritySchema = z.enum(["low", "medium", "high"]);
const EffortSchema = z.enum(["low", "medium", "high"]);

const SectionSchema = z.object({
  title: z.string(),
  content: z.string(),
  citations: z.array(z.string()).describe("Paper IDs cited in this section"),
});

const RecommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: PrioritySchema,
  effort: EffortSchema,
  relatedPapers: z.array(z.string()).describe("Paper IDs related to this rec"),
});

const CreateReportSchema = z.object({
  problemId: z.string().describe("Convex ID of the startup problem"),
  title: z.string().describe("Report title"),
  executiveSummary: z.string().describe("High-level summary"),
  sections: z.array(SectionSchema).describe("Report sections"),
  recommendations: z.array(RecommendationSchema).describe("Action items"),
  linkedResearch: z.array(z.string()).describe("Research link IDs"),
});

export const createReportTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      // Convert string IDs to Convex IDs
      const sections = input.sections.map((s) => ({
        ...s,
        citations: s.citations as AnyId[],
      }));
      const recommendations = input.recommendations.map((r) => ({
        ...r,
        relatedPapers: r.relatedPapers as AnyId[],
      }));
      const id = await client.mutation(api.solutionReports.create, {
        problemId: input.problemId as AnyId,
        title: input.title,
        executiveSummary: input.executiveSummary,
        sections,
        recommendations,
        linkedResearch: input.linkedResearch as AnyId[],
      });
      return wrapToolSuccess({ id: String(id) }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "create_solution_report",
    description: "Creates a new solution report for a startup problem",
    schema: CreateReportSchema,
  }
);

export const getReportTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const report = await client.query(api.solutionReports.getById, {
        id: input.id as AnyId,
      });
      if (!report) {
        return wrapToolError(
          new Error(`Report ${input.id} not found`),
          startTime
        );
      }
      return wrapToolSuccess(report, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_solution_report",
    description: "Gets a solution report by its Convex ID",
    schema: z.object({
      id: z.string().describe("Convex ID of the report"),
    }),
  }
);

export const listReportsTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const reports = await client.query(api.solutionReports.list, {
        status: input.status,
        limit: input.limit,
      });
      return wrapToolSuccess(reports, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "list_solution_reports",
    description: "Lists solution reports with optional filters",
    schema: z.object({
      status: ReportStatusSchema.optional().describe("Filter by status"),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const updateReportTool = tool(
  async (input): Promise<ToolResult<{ success: boolean }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const sections = input.sections?.map((s) => ({
        ...s,
        citations: s.citations as AnyId[],
      }));
      const recommendations = input.recommendations?.map((r) => ({
        ...r,
        relatedPapers: r.relatedPapers as AnyId[],
      }));
      await client.mutation(api.solutionReports.update, {
        id: input.id as AnyId,
        executiveSummary: input.executiveSummary,
        sections,
        recommendations,
      });
      return wrapToolSuccess({ success: true }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "update_solution_report",
    description: "Updates content of a solution report",
    schema: z.object({
      id: z.string().describe("Convex ID of the report"),
      executiveSummary: z.string().optional(),
      sections: z.array(SectionSchema).optional(),
      recommendations: z.array(RecommendationSchema).optional(),
    }),
  }
);

export const updateReportStatusTool = tool(
  async (input): Promise<ToolResult<{ success: boolean }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      await client.mutation(api.solutionReports.updateStatus, {
        id: input.id as AnyId,
        status: input.status,
      });
      return wrapToolSuccess({ success: true }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "update_report_status",
    description: "Updates the status of a solution report",
    schema: z.object({
      id: z.string().describe("Convex ID of the report"),
      status: ReportStatusSchema.describe("New status"),
    }),
  }
);

export const reportTools = [
  createReportTool,
  getReportTool,
  listReportsTool,
  updateReportTool,
  updateReportStatusTool,
];
