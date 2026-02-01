import type { ToolResult, ToolMetadata } from "../types";

/**
 * Standard error codes for tool operations
 */
export enum ToolErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMITED = "RATE_LIMITED",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  UNAUTHORIZED = "UNAUTHORIZED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
}

/**
 * Custom error class for tool operations
 */
export class ToolError extends Error {
  constructor(
    message: string,
    public readonly code: ToolErrorCode,
    public readonly retryable: boolean = false,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "ToolError";
  }
}

/**
 * Determines if an error should trigger a retry
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ToolError) {
    return error.retryable;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const retryablePatterns = [
      "rate limit",
      "timeout",
      "econnreset",
      "econnrefused",
      "socket hang up",
      "network",
      "503",
      "502",
      "429",
    ];

    return retryablePatterns.some((pattern) => message.includes(pattern));
  }

  return false;
}

/**
 * Wraps an error into a standardized ToolResult
 */
export function wrapToolError<T>(
  error: unknown,
  startTime: number,
  retries: number = 0
): ToolResult<T> {
  const metadata: ToolMetadata = {
    duration: Date.now() - startTime,
    cached: false,
    retries,
    timestamp: Date.now(),
  };

  if (error instanceof ToolError) {
    return {
      success: false,
      error: `[${error.code}] ${error.message}`,
      metadata,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      metadata,
    };
  }

  return {
    success: false,
    error: String(error),
    metadata,
  };
}

/**
 * Creates a successful ToolResult
 */
export function wrapToolSuccess<T>(
  data: T,
  startTime: number,
  options: Partial<ToolMetadata> = {}
): ToolResult<T> {
  return {
    success: true,
    data,
    metadata: {
      duration: Date.now() - startTime,
      cached: options.cached ?? false,
      retries: options.retries ?? 0,
      timestamp: Date.now(),
      source: options.source,
    },
  };
}

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<{ result: T; retries: number }> {
  let lastError: unknown;
  let retries = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return { result, retries };
    } catch (error) {
      lastError = error;
      retries = attempt;

      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = delayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
