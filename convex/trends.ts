import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    category: v.optional(v.string()),
    period: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("quarterly")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("trends")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .take(args.limit ?? 20);
    }
    return await ctx.db.query("trends").order("desc").take(args.limit ?? 20);
  },
});

export const getByTopic = query({
  args: { topic: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trends")
      .withIndex("by_topic", (q) => q.eq("topic", args.topic))
      .order("desc")
      .first();
  },
});

export const create = mutation({
  args: {
    category: v.string(),
    topic: v.string(),
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly")
    ),
    startDate: v.string(),
    endDate: v.string(),
    metrics: v.object({
      paperCount: v.number(),
      citationVelocity: v.optional(v.number()),
      authorCount: v.number(),
      institutionCount: v.number(),
      growthRate: v.optional(v.number()),
    }),
    timeSeries: v.array(
      v.object({
        date: v.string(),
        value: v.number(),
      })
    ),
    topPapers: v.array(v.id("papers")),
    topAuthors: v.array(v.string()),
    relatedTopics: v.array(v.string()),
    forecast: v.optional(
      v.object({
        nextPeriodEstimate: v.number(),
        confidence: v.number(),
        trend: v.union(
          v.literal("rising"),
          v.literal("stable"),
          v.literal("declining")
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("trends", {
      ...args,
      computedAt: Date.now(),
    });
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const trends = await ctx.db.query("trends").collect();
    const categories = [...new Set(trends.map((t) => t.category))];
    return categories.sort();
  },
});

export const getTopics = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let trends;

    if (args.category) {
      trends = await ctx.db
        .query("trends")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      trends = await ctx.db.query("trends").collect();
    }

    const topics = [...new Set(trends.map((t) => t.topic))];
    return topics.sort();
  },
});
