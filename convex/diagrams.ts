import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByPaperId = query({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("diagrams")
      .withIndex("by_paper", (q) => q.eq("paperId", args.paperId))
      .collect();
  },
});

export const getByInsightId = query({
  args: { insightId: v.id("insights") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("diagrams")
      .withIndex("by_insight", (q) => q.eq("insightId", args.insightId))
      .collect();
  },
});

export const list = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(
      v.union(
        v.literal("architecture"),
        v.literal("flowchart"),
        v.literal("sequence"),
        v.literal("comparison"),
        v.literal("timeline"),
        v.literal("mindmap"),
        v.literal("custom")
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("diagrams")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const create = mutation({
  args: {
    paperId: v.id("papers"),
    insightId: v.optional(v.id("insights")),
    type: v.union(
      v.literal("architecture"),
      v.literal("flowchart"),
      v.literal("sequence"),
      v.literal("comparison"),
      v.literal("timeline"),
      v.literal("mindmap"),
      v.literal("custom")
    ),
    title: v.string(),
    description: v.string(),
    mermaidCode: v.optional(v.string()),
    d3Config: v.optional(v.string()),
    svgContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("diagrams", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("diagrams"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    mermaidCode: v.optional(v.string()),
    d3Config: v.optional(v.string()),
    svgContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("diagrams") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
