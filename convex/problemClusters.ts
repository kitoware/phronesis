import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    minSize: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let clusters = await ctx.db
      .query("problemClusters")
      .withIndex("by_size")
      .order("desc")
      .take(args.limit ?? 50);

    if (args.minSize !== undefined) {
      clusters = clusters.filter((c) => c.size >= args.minSize!);
    }

    return clusters;
  },
});

export const getById = query({
  args: { id: v.id("problemClusters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByTheme = query({
  args: { theme: v.string() },
  handler: async (ctx, args) => {
    const clusters = await ctx.db.query("problemClusters").collect();
    return clusters.find(
      (c) => c.theme.toLowerCase() === args.theme.toLowerCase()
    );
  },
});

export const create = mutation({
  args: {
    theme: v.string(),
    description: v.string(),
    problemIds: v.array(v.string()),
    size: v.number(),
    industries: v.array(v.string()),
    fundingStages: v.array(v.string()),
    growthRate: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("problemClusters", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("problemClusters"),
    theme: v.optional(v.string()),
    description: v.optional(v.string()),
    problemIds: v.optional(v.array(v.string())),
    size: v.optional(v.number()),
    industries: v.optional(v.array(v.string())),
    fundingStages: v.optional(v.array(v.string())),
    growthRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const addProblem = mutation({
  args: {
    id: v.id("problemClusters"),
    problemId: v.string(),
  },
  handler: async (ctx, args) => {
    const cluster = await ctx.db.get(args.id);
    if (!cluster) {
      throw new Error("Cluster not found");
    }

    if (!cluster.problemIds.includes(args.problemId)) {
      await ctx.db.patch(args.id, {
        problemIds: [...cluster.problemIds, args.problemId],
        size: cluster.size + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const clusters = await ctx.db.query("problemClusters").collect();

    const totalProblems = clusters.reduce((acc, c) => acc + c.size, 0);
    const avgSize = clusters.length > 0 ? totalProblems / clusters.length : 0;

    const allIndustries = clusters.flatMap((c) => c.industries);
    const industryCount = allIndustries.reduce(
      (acc, ind) => {
        acc[ind] = (acc[ind] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: clusters.length,
      totalProblems,
      avgSize,
      industryCount,
    };
  },
});
