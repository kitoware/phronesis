import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  createdAt: number;
}

// In-memory cache store
const memoryCache = new Map<string, CacheEntry<unknown>>();

function getCacheKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

function isExpired(entry: CacheEntry<unknown>): boolean {
  if (entry.expiresAt === null) {
    return false;
  }
  return Date.now() > entry.expiresAt;
}

// Cache operations
export function memoryCacheGet<T>(namespace: string, key: string): T | null {
  const cacheKey = getCacheKey(namespace, key);
  const entry = memoryCache.get(cacheKey);

  if (!entry) {
    return null;
  }

  if (isExpired(entry)) {
    memoryCache.delete(cacheKey);
    return null;
  }

  return entry.value as T;
}

export function memoryCacheSet<T>(
  namespace: string,
  key: string,
  value: T,
  ttlMs?: number
): void {
  const cacheKey = getCacheKey(namespace, key);
  const now = Date.now();

  memoryCache.set(cacheKey, {
    value,
    expiresAt: ttlMs ? now + ttlMs : null,
    createdAt: now,
  });
}

export function memoryCacheDelete(namespace: string, key: string): boolean {
  const cacheKey = getCacheKey(namespace, key);
  return memoryCache.delete(cacheKey);
}

export function memoryCacheClear(namespace?: string): number {
  if (!namespace) {
    const size = memoryCache.size;
    memoryCache.clear();
    return size;
  }

  const prefix = `${namespace}:`;
  let deleted = 0;

  const keys = Array.from(memoryCache.keys());
  for (const key of keys) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
      deleted++;
    }
  }

  return deleted;
}

export function memoryCacheCleanup(): number {
  const now = Date.now();
  let deleted = 0;

  const entries = Array.from(memoryCache.entries());
  for (const [key, entry] of entries) {
    if (entry.expiresAt !== null && now > entry.expiresAt) {
      memoryCache.delete(key);
      deleted++;
    }
  }

  return deleted;
}

export function memoryCacheSize(): number {
  return memoryCache.size;
}

// LangChain Tools

const MemoryCacheGetSchema = z.object({
  namespace: z.string().describe("Cache namespace"),
  key: z.string().describe("Cache key"),
});

export const memoryCacheGetTool = tool(
  async (input): Promise<ToolResult<{ value: unknown; found: boolean }>> => {
    const startTime = Date.now();
    try {
      const value = memoryCacheGet(input.namespace, input.key);

      return wrapToolSuccess(
        {
          value,
          found: value !== null,
        },
        startTime,
        { cached: value !== null }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "memory_cache_get",
    description: "Gets a value from the in-memory cache",
    schema: MemoryCacheGetSchema,
  }
);

const MemoryCacheSetSchema = z.object({
  namespace: z.string().describe("Cache namespace"),
  key: z.string().describe("Cache key"),
  value: z.unknown().describe("Value to cache"),
  ttlMs: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Time-to-live in milliseconds"),
});

export const memoryCacheSetTool = tool(
  async (input): Promise<ToolResult<{ success: boolean }>> => {
    const startTime = Date.now();
    try {
      memoryCacheSet(input.namespace, input.key, input.value, input.ttlMs);

      return wrapToolSuccess({ success: true }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "memory_cache_set",
    description: "Sets a value in the in-memory cache with optional TTL",
    schema: MemoryCacheSetSchema,
  }
);

const MemoryCacheDeleteSchema = z.object({
  namespace: z.string().describe("Cache namespace"),
  key: z.string().describe("Cache key to delete"),
});

export const memoryCacheDeleteTool = tool(
  async (input): Promise<ToolResult<{ deleted: boolean }>> => {
    const startTime = Date.now();
    try {
      const deleted = memoryCacheDelete(input.namespace, input.key);

      return wrapToolSuccess({ deleted }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "memory_cache_delete",
    description: "Deletes a value from the in-memory cache",
    schema: MemoryCacheDeleteSchema,
  }
);

const MemoryCacheClearSchema = z.object({
  namespace: z
    .string()
    .optional()
    .describe("Namespace to clear (all if omitted)"),
});

export const memoryCacheClearTool = tool(
  async (input): Promise<ToolResult<{ deleted: number }>> => {
    const startTime = Date.now();
    try {
      const deleted = memoryCacheClear(input.namespace);

      return wrapToolSuccess({ deleted }, startTime);
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "memory_cache_clear",
    description: "Clears the in-memory cache. Optionally specify a namespace.",
    schema: MemoryCacheClearSchema,
  }
);

export const memoryCacheTools = [
  memoryCacheGetTool,
  memoryCacheSetTool,
  memoryCacheDeleteTool,
  memoryCacheClearTool,
];
