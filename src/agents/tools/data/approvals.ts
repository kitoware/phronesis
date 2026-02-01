import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import { ApprovalTypeSchema } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;

// Note: api.agentApprovals will be available after running `npx convex dev`
// to regenerate types with the new schema

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const agentApprovalsApi = (api as any).agentApprovals;

const ApprovalOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

const RequestApprovalSchema = z.object({
  requestId: z.string().describe("Unique identifier for this approval request"),
  agentRunId: z.string().optional().describe("Associated agent run ID"),
  taskId: z.string().optional().describe("Associated task ID"),
  approvalType: ApprovalTypeSchema.describe("Type of approval needed"),
  title: z.string().describe("Short title for the approval"),
  description: z
    .string()
    .describe("Detailed description of what needs approval"),
  context: z.unknown().optional().describe("Additional context data"),
  options: z
    .array(ApprovalOptionSchema)
    .optional()
    .describe("Available choices"),
  expiresAt: z.number().optional().describe("Unix timestamp when this expires"),
});

export const requestApprovalTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(agentApprovalsApi.create, {
        requestId: input.requestId,
        agentRunId: input.agentRunId as AnyId,
        taskId: input.taskId as AnyId,
        approvalType: input.approvalType,
        title: input.title,
        description: input.description,
        context: input.context,
        options: input.options,
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
          resolution: approval.resolution,
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

export const resolveApprovalTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const result = await client.mutation(agentApprovalsApi.resolve, {
        requestId: input.requestId,
        status: input.status,
        selectedOption: input.selectedOption,
        comment: input.comment,
        resolvedBy: input.resolvedBy,
      });
      return wrapToolSuccess(result, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "resolve_approval",
    description: "Resolves an approval request (approve or reject)",
    schema: z.object({
      requestId: z.string().describe("The unique request ID to resolve"),
      status: z.enum(["approved", "rejected"]).describe("Resolution decision"),
      selectedOption: z
        .string()
        .optional()
        .describe("Selected option ID if any"),
      comment: z.string().optional().describe("Comment from the reviewer"),
      resolvedBy: z.string().optional().describe("User ID who resolved"),
    }),
  }
);

export const approvalTools = [
  requestApprovalTool,
  checkApprovalTool,
  listPendingApprovalsTool,
  resolveApprovalTool,
];
