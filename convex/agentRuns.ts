import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    agentType: v.optional(
      v.union(
        v.literal("research-ingestion"),
        v.literal("insight-generation"),
        v.literal("trend-analysis"),
        v.literal("problem-discovery"),
        v.literal("research-linking"),
        v.literal("solution-synthesis")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.agentType) {
      return await ctx.db
        .query("agentRuns")
        .withIndex("by_agent_type", (q) => q.eq("agentType", args.agentType!))
        .order("desc")
        .take(args.limit ?? 50);
    }
    if (args.status) {
      return await ctx.db
        .query("agentRuns")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit ?? 50);
    }
    return await ctx.db
      .query("agentRuns")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getById = query({
  args: { id: v.id("agentRuns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getLatestByType = query({
  args: {
    agentType: v.union(
      v.literal("research-ingestion"),
      v.literal("insight-generation"),
      v.literal("trend-analysis"),
      v.literal("problem-discovery"),
      v.literal("research-linking"),
      v.literal("solution-synthesis")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentRuns")
      .withIndex("by_agent_type", (q) => q.eq("agentType", args.agentType))
      .order("desc")
      .first();
  },
});

export const create = mutation({
  args: {
    agentType: v.union(
      v.literal("research-ingestion"),
      v.literal("insight-generation"),
      v.literal("trend-analysis"),
      v.literal("problem-discovery"),
      v.literal("research-linking"),
      v.literal("solution-synthesis")
    ),
    triggeredBy: v.union(
      v.literal("scheduled"),
      v.literal("manual"),
      v.literal("webhook"),
      v.literal("dependency")
    ),
    input: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentRuns", {
      agentType: args.agentType,
      status: "pending",
      triggeredBy: args.triggeredBy,
      input: args.input,
      createdAt: Date.now(),
    });
  },
});

export const start = mutation({
  args: { id: v.id("agentRuns") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "running",
      startedAt: Date.now(),
    });
  },
});

export const complete = mutation({
  args: {
    id: v.id("agentRuns"),
    output: v.optional(v.any()),
    metrics: v.optional(
      v.object({
        duration: v.number(),
        itemsProcessed: v.number(),
        tokensUsed: v.optional(v.number()),
        apiCalls: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      output: args.output,
      metrics: args.metrics,
      completedAt: Date.now(),
    });
  },
});

export const fail = mutation({
  args: {
    id: v.id("agentRuns"),
    error: v.object({
      message: v.string(),
      stack: v.optional(v.string()),
      code: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "failed",
      error: args.error,
      completedAt: Date.now(),
    });
  },
});

export const cancel = mutation({
  args: { id: v.id("agentRuns") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "cancelled",
      completedAt: Date.now(),
    });
  },
});

export const updateOutput = mutation({
  args: {
    id: v.id("agentRuns"),
    output: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      output: args.output,
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const runs = await ctx.db.query("agentRuns").collect();

    const byAgentType = runs.reduce(
      (acc, r) => {
        acc[r.agentType] = (acc[r.agentType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byStatus = runs.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const completedRuns = runs.filter(
      (r) => r.status === "completed" && r.metrics?.duration
    );
    const avgDuration =
      completedRuns.length > 0
        ? completedRuns.reduce(
            (acc, r) => acc + (r.metrics?.duration ?? 0),
            0
          ) / completedRuns.length
        : 0;

    return {
      total: runs.length,
      byAgentType,
      byStatus,
      avgDuration,
    };
  },
});
