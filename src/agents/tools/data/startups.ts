import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import { FundingStageSchema, EmployeeCountSchema } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;

const SourceTypeSchema = z.enum(["manual", "crunchbase", "linkedin", "other"]);

const CreateStartupSchema = z.object({
  name: z.string().describe("Company name"),
  description: z.string().describe("Company description"),
  website: z.string().url().optional().describe("Company website URL"),
  linkedinUrl: z.string().url().optional().describe("LinkedIn company page"),
  crunchbaseUrl: z.string().url().optional().describe("Crunchbase profile URL"),
  foundedYear: z.number().int().optional().describe("Year founded"),
  headquartersLocation: z.string().optional().describe("HQ location"),
  employeeCount: EmployeeCountSchema.optional().describe(
    "Employee count range"
  ),
  fundingStage: FundingStageSchema.optional().describe("Current funding stage"),
  totalFunding: z.number().optional().describe("Total funding in USD"),
  industries: z.array(z.string()).describe("Industry sectors"),
  technologies: z.array(z.string()).describe("Technologies used"),
  sourceType: SourceTypeSchema.describe("Data source type"),
  sourceUrl: z.string().url().optional().describe("Source URL for the data"),
});

export const createStartupTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(api.startups.create, {
        name: input.name,
        description: input.description,
        website: input.website,
        linkedinUrl: input.linkedinUrl,
        crunchbaseUrl: input.crunchbaseUrl,
        foundedYear: input.foundedYear,
        headquartersLocation: input.headquartersLocation,
        employeeCount: input.employeeCount,
        fundingStage: input.fundingStage,
        totalFunding: input.totalFunding,
        industries: input.industries,
        technologies: input.technologies,
        sourceType: input.sourceType,
        sourceUrl: input.sourceUrl,
      });
      return wrapToolSuccess({ id: String(id) }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "create_startup",
    description: "Creates a new startup record in the database",
    schema: CreateStartupSchema,
  }
);

export const getStartupTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const startup = await client.query(api.startups.getById, {
        id: input.id as AnyId,
      });
      if (!startup) {
        return wrapToolError(
          new Error(`Startup ${input.id} not found`),
          startTime
        );
      }
      return wrapToolSuccess(startup, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_startup",
    description: "Gets a startup by its Convex ID",
    schema: z.object({
      id: z.string().describe("Convex ID of the startup"),
    }),
  }
);

export const listStartupsTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const startups = await client.query(api.startups.list, {
        fundingStage: input.fundingStage,
        limit: input.limit,
      });
      return wrapToolSuccess(startups, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "list_startups",
    description: "Lists startups with optional funding stage filter",
    schema: z.object({
      fundingStage: FundingStageSchema.optional().describe(
        "Filter by funding stage"
      ),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const searchStartupsTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const startups = await client.query(api.startups.search, {
        searchTerm: input.query,
        fundingStage: input.fundingStage,
        limit: input.limit,
      });
      return wrapToolSuccess(startups, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "search_startups",
    description: "Searches startups by name using full-text search",
    schema: z.object({
      query: z.string().describe("Search query for startup names"),
      fundingStage: FundingStageSchema.optional().describe(
        "Filter by funding stage"
      ),
      limit: z.number().int().min(1).max(50).optional().default(10),
    }),
  }
);

export const updateStartupTool = tool(
  async (input): Promise<ToolResult<{ success: boolean }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      await client.mutation(api.startups.update, {
        id: input.id as AnyId,
        description: input.description,
        website: input.website,
        fundingStage: input.fundingStage,
        totalFunding: input.totalFunding,
        employeeCount: input.employeeCount,
        industries: input.industries,
        technologies: input.technologies,
      });
      return wrapToolSuccess({ success: true }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "update_startup",
    description: "Updates a startup record with new information",
    schema: z.object({
      id: z.string().describe("Convex ID of the startup"),
      description: z.string().optional(),
      website: z.string().url().optional(),
      fundingStage: FundingStageSchema.optional(),
      totalFunding: z.number().optional(),
      employeeCount: EmployeeCountSchema.optional(),
      industries: z.array(z.string()).optional(),
      technologies: z.array(z.string()).optional(),
    }),
  }
);

export const startupTools = [
  createStartupTool,
  getStartupTool,
  listStartupsTool,
  searchStartupsTool,
  updateStartupTool,
];
