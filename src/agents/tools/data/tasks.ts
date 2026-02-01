import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import { TaskPrioritySchema, TaskStatusSchema } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;

// Note: api.agentTasks will be available after running `npx convex dev`
// to regenerate types with the new schema

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const agentTasksApi = (api as any).agentTasks;

const CreateTaskSchema = z.object({
  taskType: z
    .string()
    .describe("Type of task (e.g., 'fetch-paper', 'analyze')"),
  priority: TaskPrioritySchema.describe("Task priority"),
  payload: z.unknown().describe("Task-specific data payload"),
  maxRetries: z.number().int().min(0).max(10).optional().default(3),
  scheduledFor: z.number().optional().describe("Unix timestamp to execute at"),
});

export const createAgentTaskTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(agentTasksApi.create, {
        taskType: input.taskType,
        priority: input.priority,
        payload: input.payload,
        maxRetries: input.maxRetries,
        scheduledFor: input.scheduledFor,
      });
      return wrapToolSuccess({ id: String(id) }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "create_agent_task",
    description: "Creates a new task in the agent task queue",
    schema: CreateTaskSchema,
  }
);

export const getNextTaskTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const task = await client.query(agentTasksApi.getNextPending, {
        taskType: input.taskType,
      });
      return wrapToolSuccess(task, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_next_agent_task",
    description:
      "Gets the next pending task from the queue, prioritized by priority and creation time",
    schema: z.object({
      taskType: z.string().optional().describe("Filter by task type"),
    }),
  }
);

export const updateTaskStatusTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const task = await client.mutation(agentTasksApi.updateStatus, {
        taskId: input.taskId as AnyId,
        status: input.status,
        result: input.result,
        error: input.error,
        assignedTo: input.assignedTo,
      });
      return wrapToolSuccess(task, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "update_agent_task_status",
    description: "Updates the status of an agent task",
    schema: z.object({
      taskId: z.string().describe("Convex ID of the task"),
      status: TaskStatusSchema.describe("New task status"),
      result: z.unknown().optional().describe("Task result if completed"),
      error: z.string().optional().describe("Error message if failed"),
      assignedTo: z
        .string()
        .optional()
        .describe("Agent ID processing the task"),
    }),
  }
);

export const listTasksTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const tasks = await client.query(agentTasksApi.list, {
        status: input.status,
        taskType: input.taskType,
        limit: input.limit,
      });
      return wrapToolSuccess(tasks, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "list_agent_tasks",
    description: "Lists agent tasks with optional filters",
    schema: z.object({
      status: TaskStatusSchema.optional().describe("Filter by status"),
      taskType: z.string().optional().describe("Filter by task type"),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const getTaskTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const task = await client.query(agentTasksApi.get, {
        taskId: input.taskId as AnyId,
      });
      if (!task) {
        return wrapToolError(
          new Error(`Task ${input.taskId} not found`),
          startTime
        );
      }
      return wrapToolSuccess(task, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_agent_task",
    description: "Gets an agent task by its Convex ID",
    schema: z.object({
      taskId: z.string().describe("Convex ID of the task"),
    }),
  }
);

export const taskTools = [
  createAgentTaskTool,
  getNextTaskTool,
  updateTaskStatusTool,
  listTasksTool,
  getTaskTool,
];
