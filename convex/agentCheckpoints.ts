import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const save = mutation({
  args: {
    threadId: v.string(),
    checkpointId: v.string(),
    parentCheckpointId: v.optional(v.string()),
    state: v.any(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentCheckpoints")
      .withIndex("by_thread_and_checkpoint", (q) =>
        q.eq("threadId", args.threadId).eq("checkpointId", args.checkpointId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        state: args.state,
        metadata: args.metadata,
      });
      return existing._id;
    }

    return await ctx.db.insert("agentCheckpoints", {
      threadId: args.threadId,
      checkpointId: args.checkpointId,
      parentCheckpointId: args.parentCheckpointId,
      state: args.state,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

export const getByThread = query({
  args: {
    threadId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const checkpoints = await ctx.db
      .query("agentCheckpoints")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("desc")
      .collect();

    if (args.limit) {
      return checkpoints.slice(0, args.limit);
    }

    return checkpoints;
  },
});

export const getByCheckpointId = query({
  args: {
    checkpointId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentCheckpoints")
      .withIndex("by_checkpoint", (q) => q.eq("checkpointId", args.checkpointId))
      .first();
  },
});

export const getLatestByThread = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentCheckpoints")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("desc")
      .first();
  },
});

export const deleteByThread = mutation({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const checkpoints = await ctx.db
      .query("agentCheckpoints")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();

    for (const checkpoint of checkpoints) {
      await ctx.db.delete(checkpoint._id);
    }

    return checkpoints.length;
  },
});
