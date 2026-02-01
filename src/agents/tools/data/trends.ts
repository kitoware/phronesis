import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;

const PeriodSchema = z.enum(["daily", "weekly", "monthly", "quarterly"]);
const TrendDirectionSchema = z.enum(["rising", "stable", "declining"]);

const TimeSeriesPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});

const ForecastSchema = z.object({
  nextPeriodEstimate: z.number(),
  confidence: z.number().min(0).max(1),
  trend: TrendDirectionSchema,
});

const MetricsSchema = z.object({
  paperCount: z.number().int().min(0),
  citationVelocity: z.number().optional(),
  authorCount: z.number().int().min(0),
  institutionCount: z.number().int().min(0),
  growthRate: z.number().optional(),
});

const CreateTrendSchema = z.object({
  category: z.string().describe("ArXiv category"),
  topic: z.string().describe("Specific topic within category"),
  period: PeriodSchema.describe("Time period granularity"),
  startDate: z.string().describe("Start date (ISO format)"),
  endDate: z.string().describe("End date (ISO format)"),
  metrics: MetricsSchema.describe("Trend metrics"),
  timeSeries: z.array(TimeSeriesPointSchema).describe("Time series data"),
  topPapers: z.array(z.string()).describe("Paper IDs of top papers"),
  topAuthors: z.array(z.string()).describe("Names of top authors"),
  relatedTopics: z.array(z.string()).describe("Related topic names"),
  forecast: ForecastSchema.optional().describe("Future trend prediction"),
});

export const createTrendTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(api.trends.create, {
        category: input.category,
        topic: input.topic,
        period: input.period,
        startDate: input.startDate,
        endDate: input.endDate,
        metrics: input.metrics,
        timeSeries: input.timeSeries,
        topPapers: input.topPapers as AnyId[],
        topAuthors: input.topAuthors,
        relatedTopics: input.relatedTopics,
        forecast: input.forecast,
      });
      return wrapToolSuccess({ id: String(id) }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "create_trend",
    description: "Creates a new trend analysis record",
    schema: CreateTrendSchema,
  }
);

export const getTrendByTopicTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const trend = await client.query(api.trends.getByTopic, {
        topic: input.topic,
      });
      return wrapToolSuccess(trend, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_trend_by_topic",
    description: "Gets the latest trend data for a specific topic",
    schema: z.object({
      topic: z.string().describe("Topic name to look up"),
    }),
  }
);

export const listTrendsTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const trends = await client.query(api.trends.list, {
        category: input.category,
        period: input.period,
        limit: input.limit,
      });
      return wrapToolSuccess(trends, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "list_trends",
    description: "Lists trends with optional category and period filters",
    schema: z.object({
      category: z.string().optional().describe("Filter by ArXiv category"),
      period: PeriodSchema.optional().describe("Filter by time period"),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const trendTools = [
  createTrendTool,
  getTrendByTopicTool,
  listTrendsTool,
];
