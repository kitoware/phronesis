import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    signalType: v.optional(
      v.union(
        v.literal("job-posting"),
        v.literal("blog-post"),
        v.literal("social-media"),
        v.literal("press-release"),
        v.literal("funding-announcement"),
        v.literal("partnership"),
        v.literal("product-update"),
        v.literal("other")
      )
    ),
    minConfidence: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let signals;

    if (args.signalType) {
      signals = await ctx.db
        .query("implicitSignals")
        .withIndex("by_signal_type", (q) =>
          q.eq("signalType", args.signalType!)
        )
        .order("desc")
        .take(args.limit ?? 50);
    } else {
      signals = await ctx.db
        .query("implicitSignals")
        .order("desc")
        .take(args.limit ?? 50);
    }

    if (args.minConfidence !== undefined) {
      signals = signals.filter((s) => s.confidence >= args.minConfidence!);
    }

    return signals;
  },
});

export const getById = query({
  args: { id: v.id("implicitSignals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByStartup = query({
  args: { startupId: v.id("startups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("implicitSignals")
      .withIndex("by_startup", (q) => q.eq("startupId", args.startupId))
      .collect();
  },
});

export const getByProblem = query({
  args: { problemId: v.id("startupProblems") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("implicitSignals")
      .withIndex("by_problem", (q) => q.eq("problemId", args.problemId))
      .collect();
  },
});

export const create = mutation({
  args: {
    startupId: v.id("startups"),
    problemId: v.optional(v.id("startupProblems")),
    signalType: v.union(
      v.literal("job-posting"),
      v.literal("blog-post"),
      v.literal("social-media"),
      v.literal("press-release"),
      v.literal("funding-announcement"),
      v.literal("partnership"),
      v.literal("product-update"),
      v.literal("other")
    ),
    title: v.string(),
    content: v.string(),
    sourceUrl: v.string(),
    publishedAt: v.optional(v.string()),
    inferredIntent: v.optional(v.string()),
    confidence: v.number(),
    keywords: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("implicitSignals", {
      ...args,
      detectedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("implicitSignals"),
    problemId: v.optional(v.id("startupProblems")),
    inferredIntent: v.optional(v.string()),
    confidence: v.optional(v.number()),
    keywords: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const signals = await ctx.db.query("implicitSignals").collect();

    const byType = signals.reduce(
      (acc, s) => {
        acc[s.signalType] = (acc[s.signalType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const avgConfidence =
      signals.length > 0
        ? signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length
        : 0;

    const linkedToProblems = signals.filter((s) => s.problemId).length;

    return {
      total: signals.length,
      byType,
      avgConfidence,
      linkedToProblems,
    };
  },
});
