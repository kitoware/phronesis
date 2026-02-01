import { v } from "convex/values";
import { action, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export const list = query({
  args: {
    startupId: v.optional(v.id("startups")),
    category: v.optional(
      v.union(
        v.literal("technical"),
        v.literal("operational"),
        v.literal("market"),
        v.literal("product"),
        v.literal("scaling"),
        v.literal("other")
      )
    ),
    severity: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("identified"),
        v.literal("researching"),
        v.literal("solution-found"),
        v.literal("resolved"),
        v.literal("archived")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.startupId) {
      return await ctx.db
        .query("startupProblems")
        .withIndex("by_startup", (q) => q.eq("startupId", args.startupId!))
        .order("desc")
        .take(args.limit ?? 20);
    }
    if (args.category) {
      return await ctx.db
        .query("startupProblems")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .take(args.limit ?? 20);
    }
    if (args.severity) {
      return await ctx.db
        .query("startupProblems")
        .withIndex("by_severity", (q) => q.eq("severity", args.severity!))
        .order("desc")
        .take(args.limit ?? 20);
    }
    if (args.status) {
      return await ctx.db
        .query("startupProblems")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit ?? 20);
    }
    return await ctx.db
      .query("startupProblems")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const getById = query({
  args: { id: v.id("startupProblems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByStartup = query({
  args: { startupId: v.id("startups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("startupProblems")
      .withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
      .collect();
  },
});

// Internal query to fetch problems by IDs for vector search results
export const getByIds = internalQuery({
  args: { ids: v.array(v.id("startupProblems")) },
  handler: async (ctx, args) => {
    const problems = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return problems.filter((p) => p !== null);
  },
});

export const searchSimilar = action({
  args: {
    embedding: v.array(v.float64()),
    category: v.optional(
      v.union(
        v.literal("technical"),
        v.literal("operational"),
        v.literal("market"),
        v.literal("product"),
        v.literal("scaling"),
        v.literal("other")
      )
    ),
    severity: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<(Doc<"startupProblems"> & { _score: number })[]> => {
    // Fetch extra results to allow for post-filtering
    const fetchLimit = (args.limit ?? 10) * 3;
    const vectorResults = await ctx.vectorSearch(
      "startupProblems",
      "vector_problems",
      {
        vector: args.embedding,
        limit: fetchLimit,
      }
    );

    // Fetch full documents
    const ids = vectorResults.map((r) => r._id);
    const problems = (await ctx.runQuery(internal.problems.getByIds, {
      ids,
    })) as Doc<"startupProblems">[];

    // Create a map of scores
    const scoreMap = new Map(vectorResults.map((r) => [r._id, r._score]));

    // Post-filter by category and severity
    let filtered = problems;
    if (args.category) {
      filtered = filtered.filter((r) => r.category === args.category);
    }
    if (args.severity) {
      filtered = filtered.filter((r) => r.severity === args.severity);
    }

    // Return with scores
    return filtered.slice(0, args.limit ?? 10).map((p) => ({
      ...p,
      _score: scoreMap.get(p._id) ?? 0,
    }));
  },
});

export const create = mutation({
  args: {
    startupId: v.id("startups"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("technical"),
      v.literal("operational"),
      v.literal("market"),
      v.literal("product"),
      v.literal("scaling"),
      v.literal("other")
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    evidence: v.array(
      v.object({
        source: v.string(),
        excerpt: v.string(),
        date: v.optional(v.string()),
        url: v.optional(v.string()),
      })
    ),
    tags: v.array(v.string()),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("startupProblems", {
      ...args,
      status: "identified",
      discoveredAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("startupProblems"),
    status: v.union(
      v.literal("identified"),
      v.literal("researching"),
      v.literal("solution-found"),
      v.literal("resolved"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const problems = await ctx.db.query("startupProblems").collect();

    const byCategory = problems.reduce(
      (acc, p) => {
        acc[p.category] = (acc[p.category] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const bySeverity = problems.reduce(
      (acc, p) => {
        acc[p.severity] = (acc[p.severity] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byStatus = problems.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: problems.length,
      byCategory,
      bySeverity,
      byStatus,
    };
  },
});
