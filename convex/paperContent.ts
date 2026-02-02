import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByPaperId = query({
  args: { paperId: v.id("papers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paperContent")
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
      .query("paperContent")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const create = mutation({
  args: {
    paperId: v.id("papers"),
    fullText: v.optional(v.string()),
    sections: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
        level: v.number(),
      })
    ),
    figures: v.array(
      v.object({
        caption: v.string(),
        reference: v.string(),
        pageNumber: v.optional(v.number()),
      })
    ),
    tables: v.array(
      v.object({
        caption: v.string(),
        content: v.string(),
        reference: v.string(),
      })
    ),
    equations: v.array(
      v.object({
        latex: v.string(),
        reference: v.optional(v.string()),
        context: v.optional(v.string()),
      })
    ),
    references: v.array(
      v.object({
        title: v.optional(v.string()),
        authors: v.optional(v.array(v.string())),
        year: v.optional(v.string()),
        venue: v.optional(v.string()),
        doi: v.optional(v.string()),
        arxivId: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("paperContent")
      .withIndex("by_paper", (q) => q.eq("paperId", args.paperId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        extractedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("paperContent", {
      ...args,
      extractedAt: Date.now(),
    });
  },
});
