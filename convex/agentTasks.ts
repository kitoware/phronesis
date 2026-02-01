import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    taskType: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("critical")
    ),
    payload: v.any(),
    maxRetries: v.optional(v.number()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("agentTasks", {
      taskType: args.taskType,
      priority: args.priority,
      status: "pending",
      payload: args.payload,
      maxRetries: args.maxRetries ?? 3,
      retryCount: 0,
      scheduledFor: args.scheduledFor,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getNextPending = query({
  args: {
    taskType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    let tasksQuery = ctx.db.query("agentTasks").withIndex("by_priority_status");

    const allPending = await tasksQuery
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const eligibleTasks = allPending.filter((task) => {
      if (args.taskType && task.taskType !== args.taskType) {
        return false;
      }
      if (task.scheduledFor && task.scheduledFor > now) {
        return false;
      }
      return true;
    });

    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    eligibleTasks.sort((a, b) => {
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt - b.createdAt;
    });

    return eligibleTasks[0] ?? null;
  },
});

export const updateStatus = mutation({
  args: {
    taskId: v.id("agentTasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const task = await ctx.db.get(args.taskId);

    if (!task) {
      throw new Error(`Task ${args.taskId} not found`);
    }

    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "processing") {
      updates.startedAt = now;
    }

    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = now;
    }

    if (args.result !== undefined) {
      updates.result = args.result;
    }

    if (args.error !== undefined) {
      updates.error = args.error;
    }

    if (args.assignedTo !== undefined) {
      updates.assignedTo = args.assignedTo;
    }

    if (args.status === "failed" && task.retryCount < task.maxRetries) {
      updates.retryCount = task.retryCount + 1;
      updates.status = "pending";
    }

    await ctx.db.patch(args.taskId, updates);
    return await ctx.db.get(args.taskId);
  },
});

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled")
      )
    ),
    taskType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let tasks;

    if (args.status) {
      tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      tasks = await ctx.db.query("agentTasks").collect();
    }

    if (args.taskType) {
      tasks = tasks.filter((t) => t.taskType === args.taskType);
    }

    tasks.sort((a, b) => b.createdAt - a.createdAt);

    if (args.limit) {
      tasks = tasks.slice(0, args.limit);
    }

    return tasks;
  },
});

export const get = query({
  args: {
    taskId: v.id("agentTasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});
