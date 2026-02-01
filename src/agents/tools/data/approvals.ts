import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import {
  ApprovalCategorySchema,
  TaskPrioritySchema,
  AgentTypeSchema,
} from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;

// Note: api.agentApprovals will be available after running `npx convex dev`
// to regenerate types with the new schema

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const agentApprovalsApi = (api as any).agentApprovals;

const RequestApprovalSchema = z.object({
  requestId: z.string().describe("Unique identifier for this approval request"),
  agentTaskId: z.string().optional().describe("Associated task ID"),
  agentRunId: z.string().optional().describe("Associated agent run ID"),
  agentType: AgentTypeSchema.describe("Type of agent requesting approval"),
  title: z.string().describe("Short title for the approval"),
  description: z
    .string()
    .describe("Detailed description of what needs approval"),
  category: ApprovalCategorySchema.describe("Category of approval"),
  data: z.unknown().optional().describe("Additional data for the approval"),
  priority: TaskPrioritySchema.describe("Priority of the approval request"),
  expiresAt: z.number().optional().describe("Unix timestamp when this expires"),
});

export const requestApprovalTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(agentApprovalsApi.create, {
        requestId: input.requestId,
        agentTaskId: input.agentTaskId as AnyId,
        agentRunId: input.agentRunId as AnyId,
        agentType: input.agentType,
        title: input.title,
        description: input.description,
        category: input.category,
        data: input.data,
        priority: input.priority,
        expiresAt: input.expiresAt,
      });
      return wrapToolSuccess({ id: String(id) }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "request_approval",
    description: "Creates a human-in-the-loop approval request",
    schema: RequestApprovalSchema,
  }
);

export const checkApprovalTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const approval = await client.query(agentApprovalsApi.getByRequestId, {
        requestId: input.requestId,
      });
      if (!approval) {
        return wrapToolSuccess(null, startTime);
      }
      return wrapToolSuccess(
        {
          status: approval.status,
          reviewedAt: approval.reviewedAt,
          reviewNotes: approval.reviewNotes,
        },
        startTime
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "check_approval",
    description: "Checks the status of an approval request",
    schema: z.object({
      requestId: z.string().describe("The unique request ID to check"),
    }),
  }
);

export const listPendingApprovalsTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const approvals = await client.query(agentApprovalsApi.listPending, {
        limit: input.limit,
      });
      return wrapToolSuccess(approvals, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "list_pending_approvals",
    description: "Lists all pending approval requests",
    schema: z.object({
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const approveRequestTool = tool(
  async (input): Promise<ToolResult<void>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      await client.mutation(agentApprovalsApi.approve, {
        id: input.approvalId as AnyId,
        reviewNotes: input.reviewNotes,
      });
      return wrapToolSuccess(undefined, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "approve_request",
    description: "Approves a pending approval request",
    schema: z.object({
      approvalId: z.string().describe("Convex ID of the approval"),
      reviewNotes: z.string().optional().describe("Notes from the reviewer"),
    }),
  }
);

export const rejectRequestTool = tool(
  async (input): Promise<ToolResult<void>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      await client.mutation(agentApprovalsApi.reject, {
        id: input.approvalId as AnyId,
        reviewNotes: input.reviewNotes,
      });
      return wrapToolSuccess(undefined, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "reject_request",
    description: "Rejects a pending approval request",
    schema: z.object({
      approvalId: z.string().describe("Convex ID of the approval"),
      reviewNotes: z.string().optional().describe("Notes from the reviewer"),
    }),
  }
);

export const getApprovalStatsTool = tool(
  async (): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const stats = await client.query(agentApprovalsApi.getStats, {});
      return wrapToolSuccess(stats, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_approval_stats",
    description: "Gets statistics about approval requests",
    schema: z.object({}),
  }
);

export const approvalTools = [
  requestApprovalTool,
  checkApprovalTool,
  listPendingApprovalsTool,
  approveRequestTool,
  rejectRequestTool,
  getApprovalStatsTool,
];
