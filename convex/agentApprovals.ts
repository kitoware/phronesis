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
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("expired")
);

const categoryValidator = v.union(
  v.literal("content-publish"),
  v.literal("data-modification"),
  v.literal("external-api"),
  v.literal("resource-intensive"),
  v.literal("security-sensitive"),
  v.literal("other")
);

export const list = query({
  args: {
    status: v.optional(statusValidator),
    agentType: v.optional(agentTypeValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.status) {
      return await ctx.db
        .query("agentApprovals")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    }

    if (args.agentType) {
      return await ctx.db
        .query("agentApprovals")
        .withIndex("by_agent_type", (q) => q.eq("agentType", args.agentType!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("agentApprovals").order("desc").take(limit);
  },
});

export const listPending = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("agentApprovals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(limit);
  },
});

export const getById = query({
  args: { id: v.id("agentApprovals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByRequestId = query({
  args: { requestId: v.string() },
  handler: async (ctx, args) => {
    const approvals = await ctx.db.query("agentApprovals").collect();
    return approvals.find((a) => a.requestId === args.requestId) ?? null;
  },
});

export const countPending = query({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("agentApprovals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return pending.length;
  },
});

export const create = mutation({
  args: {
    requestId: v.string(),
    agentTaskId: v.optional(v.id("agentTasks")),
    agentRunId: v.optional(v.id("agentRuns")),
    agentType: agentTypeValidator,
    title: v.string(),
    description: v.string(),
    category: categoryValidator,
    data: v.optional(v.any()),
    priority: priorityValidator,
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentApprovals", {
      requestId: args.requestId,
      agentTaskId: args.agentTaskId,
      agentRunId: args.agentRunId,
      agentType: args.agentType,
      title: args.title,
      description: args.description,
      category: args.category,
      data: args.data,
      status: "pending",
      priority: args.priority,
      expiresAt: args.expiresAt,
      requestedAt: Date.now(),
    });
  },
});

export const approve = mutation({
  args: {
    id: v.id("agentApprovals"),
    reviewedBy: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "approved",
      reviewedBy: args.reviewedBy,
      reviewedAt: Date.now(),
      reviewNotes: args.reviewNotes,
    });
  },
});

export const reject = mutation({
  args: {
    id: v.id("agentApprovals"),
    reviewedBy: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "rejected",
      reviewedBy: args.reviewedBy,
      reviewedAt: Date.now(),
      reviewNotes: args.reviewNotes,
    });
  },
});

export const expire = mutation({
  args: { id: v.id("agentApprovals") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "expired",
      reviewedAt: Date.now(),
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const approvals = await ctx.db.query("agentApprovals").collect();

    const byStatus = approvals.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byAgentType = approvals.reduce(
      (acc, a) => {
        acc[a.agentType] = (acc[a.agentType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byCategory = approvals.reduce(
      (acc, a) => {
        acc[a.category] = (acc[a.category] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: approvals.length,
      byStatus,
      byAgentType,
      byCategory,
    };
  },
});
