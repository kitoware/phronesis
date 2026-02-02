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
    return await ctx.db
      .query("trends")
      .order("desc")
      .take(args.limit ?? 20);
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
    const categories = Array.from(new Set(trends.map((t) => t.category)));
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

    const topics = Array.from(new Set(trends.map((t) => t.topic)));
    return topics.sort();
  },
});

/**
 * Upsert a trend by trendId
 * Creates a new trend or updates an existing one
 */
export const upsert = mutation({
  args: {
    trendId: v.string(),
    name: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("emerging"),
      v.literal("growing"),
      v.literal("stable"),
      v.literal("declining"),
      v.literal("breakthrough")
    ),
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
    keywords: v.array(v.string()),
    metrics: v.object({
      paperCount: v.number(),
      paperCountPrevPeriod: v.optional(v.number()),
      growthRate: v.optional(v.number()),
      authorCount: v.number(),
      avgCitations: v.optional(v.number()),
      trendScore: v.optional(v.number()),
      institutionCount: v.number(),
      citationVelocity: v.optional(v.number()),
      momentum: v.optional(v.number()),
      crossCategoryScore: v.optional(v.number()),
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
    relatedTrends: v.optional(v.array(v.string())),
    forecast: v.optional(
      v.object({
        direction: v.optional(
          v.union(v.literal("up"), v.literal("down"), v.literal("stable"))
        ),
        confidence: v.number(),
        trend: v.optional(
          v.union(
            v.literal("rising"),
            v.literal("stable"),
            v.literal("declining")
          )
        ),
        nextPeriodEstimate: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if trend exists by trendId
    const existing = await ctx.db
      .query("trends")
      .withIndex("by_trend_id", (q) => q.eq("trendId", args.trendId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        computedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("trends", {
      ...args,
      computedAt: Date.now(),
    });
  },
});

/**
 * Query emerging trends
 */
export const emerging = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trends")
      .withIndex("by_status", (q) => q.eq("status", "emerging"))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

/**
 * Query breakthrough trends
 */
export const breakthrough = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trends")
      .withIndex("by_status", (q) => q.eq("status", "breakthrough"))
      .order("desc")
      .take(args.limit ?? 10);
  },
});

/**
 * Get trends by status
 */
export const byStatus = query({
  args: {
    status: v.union(
      v.literal("emerging"),
      v.literal("growing"),
      v.literal("stable"),
      v.literal("declining"),
      v.literal("breakthrough")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trends")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(args.limit ?? 20);
  },
});
