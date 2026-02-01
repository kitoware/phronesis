import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";
import { getConvexClient, api } from "../data/client";

// Note: api.agentCache will be available after running `npx convex dev`
// to regenerate types with the new schema

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const agentCacheApi = (api as any).agentCache;

const ConvexCacheGetSchema = z.object({
  namespace: z.string().describe("Cache namespace"),
  key: z.string().describe("Cache key"),
});

export const convexCacheGetTool = tool(
  async (input): Promise<ToolResult<{ value: unknown; found: boolean }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const value = await client.query(agentCacheApi.get, {
        namespace: input.namespace,
        key: input.key,
      });

      return wrapToolSuccess(
        {
          value,
          found: value !== null,
        },
        startTime,
        { cached: value !== null, source: "convex" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "convex_cache_get",
    description: "Gets a value from the persistent Convex cache",
    schema: ConvexCacheGetSchema,
  }
);

const ConvexCacheSetSchema = z.object({
  namespace: z.string().describe("Cache namespace"),
  key: z.string().describe("Cache key"),
  value: z.unknown().describe("Value to cache (must be JSON-serializable)"),
  ttlMs: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Time-to-live in milliseconds"),
});

export const convexCacheSetTool = tool(
  async (input): Promise<ToolResult<{ success: boolean; id: string }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const id = await client.mutation(agentCacheApi.set, {
        namespace: input.namespace,
        key: input.key,
        value: input.value,
        ttlMs: input.ttlMs,
      });

      return wrapToolSuccess({ success: true, id: String(id) }, startTime, {
        source: "convex",
      });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "convex_cache_set",
    description:
      "Sets a value in the persistent Convex cache with optional TTL",
    schema: ConvexCacheSetSchema,
  }
);

const ConvexCacheDeleteSchema = z.object({
  namespace: z.string().describe("Cache namespace"),
  key: z.string().describe("Cache key to delete"),
});

export const convexCacheDeleteTool = tool(
  async (input): Promise<ToolResult<{ deleted: boolean }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const deleted = await client.mutation(agentCacheApi.remove, {
        namespace: input.namespace,
        key: input.key,
      });

      return wrapToolSuccess({ deleted }, startTime, { source: "convex" });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "convex_cache_delete",
    description: "Deletes a value from the persistent Convex cache",
    schema: ConvexCacheDeleteSchema,
  }
);

const ConvexCacheCleanupSchema = z.object({
  namespace: z
    .string()
    .optional()
    .describe("Namespace to clean up (all if omitted)"),
});

export const convexCacheCleanupTool = tool(
  async (input): Promise<ToolResult<{ deleted: number }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const deleted = await client.mutation(agentCacheApi.cleanup, {
        namespace: input.namespace,
      });

      return wrapToolSuccess({ deleted }, startTime, { source: "convex" });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "convex_cache_cleanup",
    description:
      "Removes expired entries from the persistent Convex cache. Optionally filter by namespace.",
    schema: ConvexCacheCleanupSchema,
  }
);

const ConvexCacheClearNamespaceSchema = z.object({
  namespace: z.string().describe("Namespace to clear"),
});

export const convexCacheClearNamespaceTool = tool(
  async (input): Promise<ToolResult<{ deleted: number }>> => {
    const startTime = Date.now();
    try {
      const client = getConvexClient();
      const deleted = await client.mutation(agentCacheApi.clearNamespace, {
        namespace: input.namespace,
      });

      return wrapToolSuccess({ deleted }, startTime, { source: "convex" });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "convex_cache_clear_namespace",
    description:
      "Clears all entries in a namespace from the persistent Convex cache",
    schema: ConvexCacheClearNamespaceSchema,
  }
);

export const convexCacheTools = [
  convexCacheGetTool,
  convexCacheSetTool,
  convexCacheDeleteTool,
  convexCacheCleanupTool,
  convexCacheClearNamespaceTool,
];
