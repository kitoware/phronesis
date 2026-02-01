import type { ToolMetadata } from "../types";

/**
 * Creates initial metadata for a tool execution
 */
export function createMetadata(): ToolMetadata {
  return {
    duration: 0,
    cached: false,
    retries: 0,
    timestamp: Date.now(),
  };
}

/**
 * Updates metadata with timing information
 */
export function withTiming(metadata: ToolMetadata, startTime: number): ToolMetadata {
  return {
    ...metadata,
    duration: Date.now() - startTime,
    timestamp: Date.now(),
  };
}

/**
 * Marks metadata as cached
 */
export function markCached(metadata: ToolMetadata, source?: string): ToolMetadata {
  return {
    ...metadata,
    cached: true,
    source: source ?? "cache",
  };
}

/**
 * Increments retry count
 */
export function incrementRetries(metadata: ToolMetadata): ToolMetadata {
  return {
    ...metadata,
    retries: metadata.retries + 1,
  };
}

/**
 * Adds source information to metadata
 */
export function withSource(metadata: ToolMetadata, source: string): ToolMetadata {
  return {
    ...metadata,
    source,
  };
}

/**
 * Timer utility for tracking operation duration
 */
export class OperationTimer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Gets elapsed time in milliseconds
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Resets the timer
   */
  reset(): void {
    this.startTime = Date.now();
  }

  /**
   * Creates metadata with current timing
   */
  toMetadata(options: Partial<ToolMetadata> = {}): ToolMetadata {
    return {
      duration: this.elapsed(),
      cached: options.cached ?? false,
      retries: options.retries ?? 0,
      timestamp: Date.now(),
      source: options.source,
    };
  }
}

/**
 * Creates a new operation timer
 */
export function startTimer(): OperationTimer {
  return new OperationTimer();
}
