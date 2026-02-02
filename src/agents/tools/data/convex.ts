/**
 * Convex data helpers for agents
 * Provides convexQuery and convexMutation wrappers for use in LangGraph nodes
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

// Singleton client instance
let clientInstance: ConvexHttpClient | null = null;

/**
 * Get or create the Convex HTTP client
 */
export function getConvexClient(): ConvexHttpClient {
  if (!clientInstance) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
    }
    clientInstance = new ConvexHttpClient(url);
  }
  return clientInstance;
}

/**
 * Execute a Convex query
 * @param path - Query path in format "module:function" (e.g., "papers:list")
 * @param args - Query arguments
 */
export async function convexQuery(
  path: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const client = getConvexClient();
  const [module, func] = path.split(":");

  // Get the function reference from the api object
  const apiModule = api[module as keyof typeof api] as Record<string, unknown>;
  if (!apiModule || typeof apiModule !== "object") {
    throw new Error(`Unknown Convex module: ${module}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryFn = apiModule[func] as any;
  if (!queryFn) {
    throw new Error(`Unknown query function: ${func} in module ${module}`);
  }

  return client.query(queryFn, args);
}

/**
 * Execute a Convex mutation
 * @param path - Mutation path in format "module:function" (e.g., "trends:upsert")
 * @param args - Mutation arguments
 */
export async function convexMutation(
  path: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const client = getConvexClient();
  const [module, func] = path.split(":");

  // Get the function reference from the api object
  const apiModule = api[module as keyof typeof api] as Record<string, unknown>;
  if (!apiModule || typeof apiModule !== "object") {
    throw new Error(`Unknown Convex module: ${module}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mutationFn = apiModule[func] as any;
  if (!mutationFn) {
    throw new Error(`Unknown mutation function: ${func} in module ${module}`);
  }

  return client.mutation(mutationFn, args);
}

/**
 * Create a new Convex client with a specific URL (for testing or different environments)
 */
export function createConvexClient(url: string): ConvexHttpClient {
  return new ConvexHttpClient(url);
}
