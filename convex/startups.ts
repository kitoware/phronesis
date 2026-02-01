import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    fundingStage: v.optional(
      v.union(
        v.literal("pre-seed"),
        v.literal("seed"),
        v.literal("series-a"),
        v.literal("series-b"),
        v.literal("series-c"),
        v.literal("series-d+"),
        v.literal("public"),
        v.literal("acquired")
      )
    ),
    industry: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.fundingStage) {
      return await ctx.db
        .query("startups")
        .withIndex("by_funding_stage", (q) =>
          q.eq("fundingStage", args.fundingStage!)
        )
        .order("desc")
        .take(args.limit ?? 20);
    }
    return await ctx.db.query("startups").order("desc").take(args.limit ?? 20);
  },
});

export const getById = query({
  args: { id: v.id("startups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const search = query({
  args: {
    searchTerm: v.string(),
    fundingStage: v.optional(
      v.union(
        v.literal("pre-seed"),
        v.literal("seed"),
        v.literal("series-a"),
        v.literal("series-b"),
        v.literal("series-c"),
        v.literal("series-d+"),
        v.literal("public"),
        v.literal("acquired")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query("startups")
      .withSearchIndex("search_startups", (q) => {
        let search = q.search("name", args.searchTerm);
        if (args.fundingStage) {
          search = search.eq("fundingStage", args.fundingStage);
        }
        return search;
      });

    return await searchQuery.take(args.limit ?? 20);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    crunchbaseUrl: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    headquartersLocation: v.optional(v.string()),
    employeeCount: v.optional(
      v.union(
        v.literal("1-10"),
        v.literal("11-50"),
        v.literal("51-200"),
        v.literal("201-500"),
        v.literal("501-1000"),
        v.literal("1000+")
      )
    ),
    fundingStage: v.optional(
      v.union(
        v.literal("pre-seed"),
        v.literal("seed"),
        v.literal("series-a"),
        v.literal("series-b"),
        v.literal("series-c"),
        v.literal("series-d+"),
        v.literal("public"),
        v.literal("acquired")
      )
    ),
    totalFunding: v.optional(v.number()),
    industries: v.array(v.string()),
    technologies: v.array(v.string()),
    sourceType: v.union(
      v.literal("manual"),
      v.literal("crunchbase"),
      v.literal("linkedin"),
      v.literal("other")
    ),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("startups", {
      ...args,
      lastUpdated: now,
      createdAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("startups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    crunchbaseUrl: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    headquartersLocation: v.optional(v.string()),
    employeeCount: v.optional(
      v.union(
        v.literal("1-10"),
        v.literal("11-50"),
        v.literal("51-200"),
        v.literal("201-500"),
        v.literal("501-1000"),
        v.literal("1000+")
      )
    ),
    fundingStage: v.optional(
      v.union(
        v.literal("pre-seed"),
        v.literal("seed"),
        v.literal("series-a"),
        v.literal("series-b"),
        v.literal("series-c"),
        v.literal("series-d+"),
        v.literal("public"),
        v.literal("acquired")
      )
    ),
    totalFunding: v.optional(v.number()),
    industries: v.optional(v.array(v.string())),
    technologies: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      lastUpdated: Date.now(),
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const startups = await ctx.db.query("startups").collect();

    const byStage = startups.reduce(
      (acc, s) => {
        const stage = s.fundingStage ?? "unknown";
        acc[stage] = (acc[stage] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: startups.length,
      byStage,
    };
  },
});
