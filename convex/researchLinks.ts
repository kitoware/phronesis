import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    problemId: v.optional(v.id("startupProblems")),
    paperId: v.optional(v.id("papers")),
    reviewStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("needs-review")
      )
    ),
    minRelevance: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;

    if (args.problemId) {
      results = await ctx.db
        .query("researchLinks")
        .withIndex("by_problem", (q) => q.eq("problemId", args.problemId!))
        .order("desc")
        .take(args.limit ?? 50);
    } else if (args.paperId) {
      results = await ctx.db
        .query("researchLinks")
        .withIndex("by_paper", (q) => q.eq("paperId", args.paperId!))
        .order("desc")
        .take(args.limit ?? 50);
    } else if (args.reviewStatus) {
      results = await ctx.db
        .query("researchLinks")
        .withIndex("by_review_status", (q) =>
          q.eq("reviewStatus", args.reviewStatus!)
        )
        .order("desc")
        .take(args.limit ?? 50);
    } else {
      results = await ctx.db
        .query("researchLinks")
        .order("desc")
        .take(args.limit ?? 50);
    }

    if (args.minRelevance !== undefined) {
      results = results.filter((r) => r.relevanceScore >= args.minRelevance!);
    }

    return results;
  },
});

export const getById = query({
  args: { id: v.id("researchLinks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByProblem = query({
  args: {
    problemId: v.id("startupProblems"),
    minRelevance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("researchLinks")
      .withIndex("by_problem", (q) => q.eq("problemId", args.problemId))
      .order("desc")
      .collect();

    if (args.minRelevance !== undefined) {
      results = results.filter((r) => r.relevanceScore >= args.minRelevance!);
    }

    return results;
  },
});

export const getByPaper = query({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("researchLinks")
      .withIndex("by_paper", (q) => q.eq("paperId", args.paperId))
      .collect();
  },
});

export const create = mutation({
  args: {
    problemId: v.id("startupProblems"),
    paperId: v.id("papers"),
    insightId: v.optional(v.id("insights")),
    relevanceScore: v.number(),
    matchType: v.union(
      v.literal("direct"),
      v.literal("methodology"),
      v.literal("tangential"),
      v.literal("inspiration")
    ),
    matchRationale: v.string(),
    keyInsights: v.array(v.string()),
    applicationSuggestions: v.array(v.string()),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("researchLinks", {
      ...args,
      createdAt: Date.now(),
      reviewStatus: "pending",
    });
  },
});

export const updateReview = mutation({
  args: {
    id: v.id("researchLinks"),
    reviewStatus: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("needs-review")
    ),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      reviewStatus: args.reviewStatus,
      reviewNotes: args.reviewNotes,
      reviewedAt: Date.now(),
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const links = await ctx.db.query("researchLinks").collect();

    const byMatchType = links.reduce(
      (acc, l) => {
        acc[l.matchType] = (acc[l.matchType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byReviewStatus = links.reduce(
      (acc, l) => {
        acc[l.reviewStatus] = (acc[l.reviewStatus] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const avgRelevance =
      links.length > 0
        ? links.reduce((acc, l) => acc + l.relevanceScore, 0) / links.length
        : 0;

    return {
      total: links.length,
      byMatchType,
      byReviewStatus,
      avgRelevance,
    };
  },
});
