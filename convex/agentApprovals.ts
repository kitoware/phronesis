import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    requestId: v.string(),
    agentRunId: v.optional(v.id("agentRuns")),
    taskId: v.optional(v.id("agentTasks")),
    approvalType: v.union(
      v.literal("action"),
      v.literal("output"),
      v.literal("decision"),
      v.literal("escalation")
    ),
    title: v.string(),
    description: v.string(),
    context: v.optional(v.any()),
    options: v.optional(
      v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          description: v.optional(v.string()),
        })
      )
    ),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentApprovals")
      .withIndex("by_request_id", (q) => q.eq("requestId", args.requestId))
      .first();

    if (existing) {
      throw new Error(`Approval request ${args.requestId} already exists`);
    }

    return await ctx.db.insert("agentApprovals", {
      requestId: args.requestId,
      agentRunId: args.agentRunId,
      taskId: args.taskId,
      approvalType: args.approvalType,
      title: args.title,
      description: args.description,
      context: args.context,
      options: args.options,
      status: "pending",
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});

export const getByRequestId = query({
  args: {
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentApprovals")
      .withIndex("by_request_id", (q) => q.eq("requestId", args.requestId))
      .first();
  },
});

export const listPending = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const pending = await ctx.db
      .query("agentApprovals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const active = pending.filter((a) => !a.expiresAt || a.expiresAt > now);

    active.sort((a, b) => a.createdAt - b.createdAt);

    if (args.limit) {
      return active.slice(0, args.limit);
    }

    return active;
  },
});

export const resolve = mutation({
  args: {
    requestId: v.string(),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    selectedOption: v.optional(v.string()),
    comment: v.optional(v.string()),
    resolvedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db
      .query("agentApprovals")
      .withIndex("by_request_id", (q) => q.eq("requestId", args.requestId))
      .first();

    if (!approval) {
      throw new Error(`Approval request ${args.requestId} not found`);
    }

    if (approval.status !== "pending") {
      throw new Error(
        `Approval request ${args.requestId} is already ${approval.status}`
      );
    }

    await ctx.db.patch(approval._id, {
      status: args.status,
      resolution: {
        selectedOption: args.selectedOption,
        comment: args.comment,
        resolvedBy: args.resolvedBy,
        resolvedAt: Date.now(),
      },
    });

    return await ctx.db.get(approval._id);
  },
});

export const expireOld = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const pending = await ctx.db
      .query("agentApprovals")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const expired = pending.filter((a) => a.expiresAt && a.expiresAt <= now);

    for (const approval of expired) {
      await ctx.db.patch(approval._id, {
        status: "expired",
      });
    }

    return expired.length;
  },
});

export const get = query({
  args: {
    approvalId: v.id("agentApprovals"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.approvalId);
  },
});
