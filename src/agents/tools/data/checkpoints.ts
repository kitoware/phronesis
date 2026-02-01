import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getConvexClient, api } from "./client";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

// Note: api.agentCheckpoints will be available after running `npx convex dev`
// to regenerate types with the new schema

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const agentCheckpointsApi = (api as any).agentCheckpoints;

const SaveCheckpointSchema = z.object({
  threadId: z.string().describe("LangGraph thread ID"),
  checkpointId: z.string().describe("Unique checkpoint identifier"),
  parentCheckpointId: z.string().optional().describe("Parent checkpoint ID"),
  state: z.unknown().describe("Serialized LangGraph state"),
  metadata: z.unknown().optional().describe("Additional metadata"),
});

export const saveCheckpointTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(agentCheckpointsApi.save, {
        threadId: input.threadId,
        checkpointId: input.checkpointId,
        parentCheckpointId: input.parentCheckpointId,
        state: input.state,
        metadata: input.metadata,
      });
      return wrapToolSuccess({ id: String(id) }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "save_checkpoint",
    description: "Saves a LangGraph checkpoint for state persistence",
    schema: SaveCheckpointSchema,
  }
);

export const loadCheckpointTool = tool(
  async (input): Promise<ToolResult<unknown>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();

      if (input.checkpointId) {
        const checkpoint = await client.query(
          agentCheckpointsApi.getByCheckpointId,
          {
            checkpointId: input.checkpointId,
          }
        );
        return wrapToolSuccess(checkpoint, startTime);
      }

      const checkpoint = await client.query(
        agentCheckpointsApi.getLatestByThread,
        {
          threadId: input.threadId,
        }
      );
      return wrapToolSuccess(checkpoint, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "load_checkpoint",
    description:
      "Loads a LangGraph checkpoint by ID or gets the latest for a thread",
    schema: z.object({
      threadId: z.string().describe("LangGraph thread ID"),
      checkpointId: z.string().optional().describe("Specific checkpoint ID"),
    }),
  }
);

export const listCheckpointsTool = tool(
  async (input): Promise<ToolResult<unknown[]>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const checkpoints = await client.query(agentCheckpointsApi.getByThread, {
        threadId: input.threadId,
        limit: input.limit,
      });
      return wrapToolSuccess(checkpoints, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "list_checkpoints",
    description: "Lists all checkpoints for a thread, newest first",
    schema: z.object({
      threadId: z.string().describe("LangGraph thread ID"),
      limit: z.number().int().min(1).max(100).optional().default(20),
    }),
  }
);

export const deleteCheckpointsTool = tool(
  async (input): Promise<ToolResult<{ deleted: number }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const deleted = await client.mutation(
        agentCheckpointsApi.deleteByThread,
        {
          threadId: input.threadId,
        }
      );
      return wrapToolSuccess({ deleted }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "delete_checkpoints",
    description: "Deletes all checkpoints for a thread",
    schema: z.object({
      threadId: z.string().describe("LangGraph thread ID"),
    }),
  }
);

export const checkpointTools = [
  saveCheckpointTool,
  loadCheckpointTool,
  listCheckpointsTool,
  deleteCheckpointsTool,
];
