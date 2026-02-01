import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("solutionReports")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit ?? 20);
    }
    return await ctx.db
      .query("solutionReports")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const getById = query({
  args: { id: v.id("solutionReports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByProblem = query({
  args: { problemId: v.id("startupProblems") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("solutionReports")
      .withIndex("by_problem", (q) => q.eq("problemId", args.problemId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    problemId: v.id("startupProblems"),
    title: v.string(),
    executiveSummary: v.string(),
    sections: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
        citations: v.array(v.id("papers")),
      })
    ),
    recommendations: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        effort: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        relatedPapers: v.array(v.id("papers")),
      })
    ),
    linkedResearch: v.array(v.id("researchLinks")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("solutionReports", {
      ...args,
      generatedAt: Date.now(),
      version: 1,
      status: "draft",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("solutionReports"),
    title: v.optional(v.string()),
    executiveSummary: v.optional(v.string()),
    sections: v.optional(
      v.array(
        v.object({
          title: v.string(),
          content: v.string(),
          citations: v.array(v.id("papers")),
        })
      )
    ),
    recommendations: v.optional(
      v.array(
        v.object({
          title: v.string(),
          description: v.string(),
          priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
          effort: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
          relatedPapers: v.array(v.id("papers")),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const current = await ctx.db.get(id);
    if (!current) {
      throw new Error("Report not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      version: current.version + 1,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("solutionReports"),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const reports = await ctx.db.query("solutionReports").collect();

    const byStatus = reports.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: reports.length,
      byStatus,
    };
  },
});
