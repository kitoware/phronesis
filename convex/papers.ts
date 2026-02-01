import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("papers")
        .withIndex("by_processing_status", (q) =>
          q.eq("processingStatus", args.status!)
        )
        .order("desc")
        .take(args.limit ?? 20);
    }
    return await ctx.db.query("papers").order("desc").take(args.limit ?? 20);
  },
});

export const getById = query({
  args: { id: v.id("papers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByArxivId = query({
  args: { arxivId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("papers")
      .withIndex("by_arxiv_id", (q) => q.eq("arxivId", args.arxivId))
      .first();
  },
});

export const search = query({
  args: {
    searchTerm: v.string(),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query("papers")
      .withSearchIndex("search_papers", (q) => {
        let search = q.search("title", args.searchTerm);
        if (args.category) {
          search = search.eq("primaryCategory", args.category);
        }
        return search;
      });

    return await searchQuery.take(args.limit ?? 20);
  },
});

export const create = mutation({
  args: {
    arxivId: v.string(),
    title: v.string(),
    abstract: v.string(),
    authors: v.array(
      v.object({
        name: v.string(),
        affiliations: v.optional(v.array(v.string())),
      })
    ),
    categories: v.array(v.string()),
    primaryCategory: v.string(),
    publishedDate: v.string(),
    updatedDate: v.optional(v.string()),
    pdfUrl: v.string(),
    doi: v.optional(v.string()),
    journalRef: v.optional(v.string()),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("papers")
      .withIndex("by_arxiv_id", (q) => q.eq("arxivId", args.arxivId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("papers", {
      ...args,
      processingStatus: "pending",
      fetchedAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("papers"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      processingStatus: args.status,
    };

    if (args.status === "completed") {
      updates.processedAt = Date.now();
    }

    if (args.error) {
      updates.processingError = args.error;
    }

    await ctx.db.patch(args.id, updates);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const papers = await ctx.db.query("papers").collect();

    const stats = {
      total: papers.length,
      pending: papers.filter((p) => p.processingStatus === "pending").length,
      processing: papers.filter((p) => p.processingStatus === "processing").length,
      completed: papers.filter((p) => p.processingStatus === "completed").length,
      failed: papers.filter((p) => p.processingStatus === "failed").length,
    };

    return stats;
  },
});
