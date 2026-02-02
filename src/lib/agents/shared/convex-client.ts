import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";
import type { FunctionReference, FunctionReturnType } from "convex/server";

/**
 * Creates a server-side Convex HTTP client for use in API routes.
 */
export function createConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }

  return new ConvexHttpClient(convexUrl);
}

// Re-export types for convenience
export type { Id, Doc };
export { api };

// Type helper for query/mutation return types
export type ConvexReturnType<
  T extends FunctionReference<"query" | "mutation" | "action">,
> = FunctionReturnType<T>;
