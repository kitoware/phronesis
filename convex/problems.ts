import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    let query = ctx.db.query("startupProblems");

    if (args.startupId) {
      query = query.withIndex("by_startup", (q) =>
        q.eq("startupId", args.startupId!)
      );
    } else if (args.category) {
      query = query.withIndex("by_category", (q) =>
        q.eq("category", args.category!)
      );
    } else if (args.severity) {
      query = query.withIndex("by_severity", (q) =>
        q.eq("severity", args.severity!)
      );
    } else if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status!));
    }

    return await query.order("desc").take(args.limit ?? 20);
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

export const searchSimilar = query({
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
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("startupProblems")
      .withIndex("vector_problems", (q) => {
        let vectorQuery = q.eq("embedding", args.embedding as number[]);
        if (args.category) {
          vectorQuery = vectorQuery.eq("category", args.category);
        }
        if (args.severity) {
          vectorQuery = vectorQuery.eq("severity", args.severity);
        }
        return vectorQuery;
      })
      .take(args.limit ?? 10);

    return results;
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
