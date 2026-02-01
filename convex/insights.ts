import { v } from "convex/values";
import { action, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export const getByPaperId = query({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("insights")
      .withIndex("by_paper", (q) => q.eq("paperId", args.paperId))
      .first();
  },
});

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("insights")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

// Internal query to fetch insights by IDs for vector search results
export const getByIds = internalQuery({
  args: { ids: v.array(v.id("insights")) },
  handler: async (ctx, args) => {
    const insights = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return insights.filter((i) => i !== null);
  },
});

export const searchSimilar = action({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<(Doc<"insights"> & { _score: number })[]> => {
    const vectorResults = await ctx.vectorSearch(
      "insights",
      "vector_insights",
      {
        vector: args.embedding,
        limit: args.limit ?? 10,
      }
    );

    // Fetch full documents
    const ids = vectorResults.map((r) => r._id);
    const insights = (await ctx.runQuery(internal.insights.getByIds, {
      ids,
    })) as Doc<"insights">[];

    // Create a map of scores
    const scoreMap = new Map(vectorResults.map((r) => [r._id, r._score]));

    // Return with scores
    return insights.map((i) => ({
      ...i,
      _score: scoreMap.get(i._id) ?? 0,
    }));
  },
});

export const create = mutation({
  args: {
    paperId: v.id("papers"),
    summary: v.string(),
    keyFindings: v.array(v.string()),
    methodology: v.string(),
    limitations: v.array(v.string()),
    futureWork: v.array(v.string()),
    technicalContributions: v.array(
      v.object({
        type: v.string(),
        description: v.string(),
        significance: v.union(
          v.literal("incremental"),
          v.literal("notable"),
          v.literal("significant"),
          v.literal("breakthrough")
        ),
      })
    ),
    practicalApplications: v.array(v.string()),
    targetAudience: v.array(v.string()),
    prerequisites: v.array(v.string()),
    embedding: v.array(v.float64()),
    analysisVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("insights")
      .withIndex("by_paper", (q) => q.eq("paperId", args.paperId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        analyzedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("insights", {
      ...args,
      analyzedAt: Date.now(),
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const insights = await ctx.db.query("insights").collect();

    return {
      total: insights.length,
      avgKeyFindings:
        insights.length > 0
          ? insights.reduce((acc, i) => acc + i.keyFindings.length, 0) /
            insights.length
          : 0,
    };
  },
});
