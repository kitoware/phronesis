import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import {
  TaskPrioritySchema,
  TaskStatusSchema,
  TriggerTypeSchema,
  AgentTypeSchema,
} from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyId = any;

// Note: api.agentTasks will be available after running `npx convex dev`
// to regenerate types with the new schema

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const agentTasksApi = (api as any).agentTasks;

const CreateTaskSchema = z.object({
  agentType: AgentTypeSchema.describe("Type of agent to run"),
  title: z.string().describe("Task title"),
  description: z.string().optional().describe("Task description"),
  priority: TaskPrioritySchema.describe("Task priority"),
  triggeredBy: TriggerTypeSchema.describe("How the task was triggered"),
  payload: z.unknown().optional().describe("Task-specific data payload"),
});

export const createAgentTaskTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(agentTasksApi.create, {
        agentType: input.agentType,
        title: input.title,
        description: input.description,
        priority: input.priority,
        triggeredBy: input.triggeredBy,
        payload: input.payload,
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

export const listActiveTasksTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const tasks = await client.query(agentTasksApi.listActive, {
        limit: input.limit,
      });
      return wrapToolSuccess(tasks, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "list_active_agent_tasks",
    description: "Lists active tasks (queued, running, paused) from the queue",
    schema: z.object({
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const updateTaskStatusTool = tool(
  async (input): Promise<ToolResult<void>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      await client.mutation(agentTasksApi.updateStatus, {
        id: input.taskId as AnyId,
        status: input.status,
      });
      return wrapToolSuccess(undefined, startTime);
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
    }),
  }
);

export const updateTaskProgressTool = tool(
  async (input): Promise<ToolResult<void>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      await client.mutation(agentTasksApi.updateProgress, {
        id: input.taskId as AnyId,
        progress: input.progress,
      });
      return wrapToolSuccess(undefined, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "update_agent_task_progress",
    description: "Updates the progress of an agent task (0-100)",
    schema: z.object({
      taskId: z.string().describe("Convex ID of the task"),
      progress: z.number().min(0).max(100).describe("Progress percentage"),
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
        agentType: input.agentType,
        priority: input.priority,
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
      agentType: AgentTypeSchema.optional().describe("Filter by agent type"),
      priority: TaskPrioritySchema.optional().describe("Filter by priority"),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const getTaskTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const task = await client.query(agentTasksApi.getById, {
        id: input.taskId as AnyId,
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

export const cancelTaskTool = tool(
  async (input): Promise<ToolResult<void>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      await client.mutation(agentTasksApi.cancel, {
        id: input.taskId as AnyId,
      });
      return wrapToolSuccess(undefined, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "cancel_agent_task",
    description: "Cancels an agent task",
    schema: z.object({
      taskId: z.string().describe("Convex ID of the task"),
    }),
  }
);

export const getTaskStatsTool = tool(
  async (): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const stats = await client.query(agentTasksApi.getStats, {});
      return wrapToolSuccess(stats, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "get_agent_task_stats",
    description: "Gets statistics about agent tasks",
    schema: z.object({}),
  }
);

export const taskTools = [
  createAgentTaskTool,
  listActiveTasksTool,
  updateTaskStatusTool,
  updateTaskProgressTool,
  listTasksTool,
  getTaskTool,
  cancelTaskTool,
  getTaskStatsTool,
];
