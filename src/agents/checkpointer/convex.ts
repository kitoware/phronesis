/**
 * Convex Checkpointer for LangGraph
 * Persists graph state to Convex database for resumable workflows
 */

import {
  BaseCheckpointSaver,
  Checkpoint,
  CheckpointMetadata,
  CheckpointTuple,
  type PendingWrite,
} from "@langchain/langgraph-checkpoint";
import { RunnableConfig } from "@langchain/core/runnables";
import { ConvexHttpClient } from "convex/browser";

export class ConvexCheckpointer extends BaseCheckpointSaver {
  private client: ConvexHttpClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private apiModule: any;

  constructor(client?: ConvexHttpClient) {
    super();
    if (client) {
      this.client = client;
    } else {
      const url = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!url) {
        throw new Error(
          "NEXT_PUBLIC_CONVEX_URL environment variable is not set"
        );
      }
      this.client = new ConvexHttpClient(url);
    }

    // Dynamically import api to avoid type generation timing issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    this.apiModule = require("../../../convex/_generated/api").api;
  }

  /**
   * Get the thread ID from config
   */
  private getThreadId(config: RunnableConfig): string {
    const threadId = config.configurable?.thread_id;
    if (!threadId || typeof threadId !== "string") {
      throw new Error("thread_id is required in config.configurable");
    }
    return threadId;
  }

  /**
   * Get the checkpoint ID from config
   */
  private getCheckpointId(config: RunnableConfig): string | undefined {
    return config.configurable?.checkpoint_id as string | undefined;
  }

  /**
   * Get a checkpoint tuple by config
   */
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = this.getThreadId(config);
    const checkpointId = this.getCheckpointId(config);

    try {
      const result = await this.client.query(
        this.apiModule.agentCheckpoints?.get,
        {
          threadId,
          checkpointId,
        }
      );

      if (!result) {
        return undefined;
      }

      return {
        config: {
          configurable: {
            thread_id: threadId,
            checkpoint_id: (result.checkpoint as { id?: string })?.id,
            checkpoint_ns: "",
          },
        },
        checkpoint: result.checkpoint as Checkpoint,
        metadata: result.metadata as CheckpointMetadata,
        parentConfig: result.parentId
          ? {
              configurable: {
                thread_id: threadId,
                checkpoint_id: result.parentId,
                checkpoint_ns: "",
              },
            }
          : undefined,
        pendingWrites: [],
      };
    } catch (error) {
      console.error("[ConvexCheckpointer] getTuple error:", error);
      return undefined;
    }
  }

  /**
   * List checkpoints for a thread
   */
  async *list(
    config: RunnableConfig,
    options?: {
      limit?: number;
      before?: RunnableConfig;
      filter?: Record<string, unknown>;
    }
  ): AsyncGenerator<CheckpointTuple> {
    const threadId = this.getThreadId(config);

    try {
      const results = await this.client.query(
        this.apiModule.agentCheckpoints?.list,
        {
          threadId,
          limit: options?.limit,
        }
      );

      for (const result of results as Array<{
        checkpoint: { id?: string };
        metadata: unknown;
        parentId?: string;
      }>) {
        yield {
          config: {
            configurable: {
              thread_id: threadId,
              checkpoint_id: result.checkpoint?.id,
              checkpoint_ns: "",
            },
          },
          checkpoint: result.checkpoint as unknown as Checkpoint,
          metadata: result.metadata as CheckpointMetadata,
          parentConfig: result.parentId
            ? {
                configurable: {
                  thread_id: threadId,
                  checkpoint_id: result.parentId,
                  checkpoint_ns: "",
                },
              }
            : undefined,
          pendingWrites: [],
        };
      }
    } catch (error) {
      console.error("[ConvexCheckpointer] list error:", error);
    }
  }

  /**
   * Save a checkpoint
   */
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    _newVersions: Record<string, number>
  ): Promise<RunnableConfig> {
    const threadId = this.getThreadId(config);
    const parentCheckpointId = this.getCheckpointId(config);

    try {
      await this.client.mutation(this.apiModule.agentCheckpoints?.upsert, {
        threadId,
        checkpoint: checkpoint as unknown as Record<string, unknown>,
        metadata: metadata as unknown as Record<string, unknown>,
        parentId: parentCheckpointId,
      });

      return {
        configurable: {
          thread_id: threadId,
          checkpoint_id: checkpoint.id,
          checkpoint_ns: "",
        },
      };
    } catch (error) {
      console.error("[ConvexCheckpointer] put error:", error);
      throw error;
    }
  }

  /**
   * Write pending writes (for atomic multi-step operations)
   */
  async putWrites(
    _config: RunnableConfig,
    _writes: PendingWrite[],
    _taskId: string
  ): Promise<void> {
    // Pending writes are not fully implemented in this version
  }

  /**
   * Delete a thread and its checkpoints
   */
  async deleteThread(_threadId: string): Promise<void> {
    // Not implemented - would call agentCheckpoints.deleteByThread
  }
}
