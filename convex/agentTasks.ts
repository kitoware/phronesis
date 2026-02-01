import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const agentTypeValidator = v.union(
  v.literal("research-ingestion"),
  v.literal("insight-generation"),
  v.literal("trend-analysis"),
  v.literal("problem-discovery"),
  v.literal("research-linking"),
  v.literal("solution-synthesis")
);

const priorityValidator = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

const statusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("paused"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("cancelled")
);

const triggeredByValidator = v.union(
  v.literal("scheduled"),
  v.literal("manual"),
  v.literal("webhook"),
  v.literal("dependency")
);

export const list = query({
  args: {
    status: v.optional(statusValidator),
    agentType: v.optional(agentTypeValidator),
    priority: v.optional(priorityValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.status) {
      return await ctx.db
        .query("agentTasks")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    }

    if (args.agentType) {
      return await ctx.db
        .query("agentTasks")
        .withIndex("by_agent_type", (q) => q.eq("agentType", args.agentType!))
        .order("desc")
        .take(limit);
    }

    if (args.priority) {
      return await ctx.db
        .query("agentTasks")
        .withIndex("by_priority", (q) => q.eq("priority", args.priority!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("agentTasks").order("desc").take(limit);
  },
});

export const listActive = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const queued = await ctx.db
      .query("agentTasks")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
      .order("desc")
      .take(limit);

    const running = await ctx.db
      .query("agentTasks")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .order("desc")
      .take(limit);

    const paused = await ctx.db
      .query("agentTasks")
      .withIndex("by_status", (q) => q.eq("status", "paused"))
      .order("desc")
      .take(limit);

    return [...queued, ...running, ...paused].sort(
      (a, b) => b.createdAt - a.createdAt
    );
  },
});

export const getById = query({
  args: { id: v.id("agentTasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const countPending = query({
  args: {},
  handler: async (ctx) => {
    const queued = await ctx.db
      .query("agentTasks")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
      .collect();
    return queued.length;
  },
});

export const countByStatus = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("agentTasks").collect();
    return all.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  },
});

export const create = mutation({
  args: {
    agentType: agentTypeValidator,
    title: v.string(),
    description: v.optional(v.string()),
    priority: priorityValidator,
    triggeredBy: triggeredByValidator,
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentTasks", {
      agentType: args.agentType,
      title: args.title,
      description: args.description,
      priority: args.priority,
      status: "queued",
      triggeredBy: args.triggeredBy,
      payload: args.payload,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("agentTasks"),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status };

    if (args.status === "running") {
      updates.startedAt = Date.now();
    }

    if (
      args.status === "completed" ||
      args.status === "failed" ||
      args.status === "cancelled"
    ) {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
  },
});

export const updateProgress = mutation({
  args: {
    id: v.id("agentTasks"),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { progress: args.progress });
  },
});

export const linkAgentRun = mutation({
  args: {
    id: v.id("agentTasks"),
    agentRunId: v.id("agentRuns"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { agentRunId: args.agentRunId });
  },
});

export const cancel = mutation({
  args: { id: v.id("agentTasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "cancelled",
      completedAt: Date.now(),
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("agentTasks").collect();

    const byStatus = tasks.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byAgentType = tasks.reduce(
      (acc, t) => {
        acc[t.agentType] = (acc[t.agentType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byPriority = tasks.reduce(
      (acc, t) => {
        acc[t.priority] = (acc[t.priority] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: tasks.length,
      byStatus,
      byAgentType,
      byPriority,
    };
  },
});
