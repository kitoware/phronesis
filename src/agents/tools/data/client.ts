import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

let clientInstance: ConvexHttpClient | null = null;

/**
 * Gets or creates a Convex HTTP client instance
 * Uses NEXT_PUBLIC_CONVEX_URL from environment
 */
export function getConvexClient(): ConvexHttpClient {
  if (clientInstance) {
    return clientInstance;
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  }

  clientInstance = new ConvexHttpClient(convexUrl);
  return clientInstance;
}

/**
 * Resets the client instance (useful for testing)
 */
export function resetConvexClient(): void {
  clientInstance = null;
}

/**
 * Gets the Convex API reference
 */
export function getApi() {
  return api;
}

export { api };
