import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    itemType: v.optional(
      v.union(
        v.literal("paper"),
        v.literal("insight"),
        v.literal("startup"),
        v.literal("problem"),
        v.literal("solution")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    let query = ctx.db.query("bookmarks");

    if (args.itemType) {
      query = query.withIndex("by_user_and_type", (q) =>
        q.eq("userId", user._id).eq("itemType", args.itemType!)
      );
    } else {
      query = query.withIndex("by_user", (q) => q.eq("userId", user._id));
    }

    return await query.order("desc").take(args.limit ?? 50);
  },
});

export const isBookmarked = query({
  args: {
    itemType: v.union(
      v.literal("paper"),
      v.literal("insight"),
      v.literal("startup"),
      v.literal("problem"),
      v.literal("solution")
    ),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return false;
    }

    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_item", (q) =>
        q.eq("itemType", args.itemType).eq("itemId", args.itemId)
      )
      .first();

    return bookmark !== null && bookmark.userId === user._id;
  },
});

export const create = mutation({
  args: {
    itemType: v.union(
      v.literal("paper"),
      v.literal("insight"),
      v.literal("startup"),
      v.literal("problem"),
      v.literal("solution")
    ),
    itemId: v.string(),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already bookmarked
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_item", (q) =>
        q.eq("itemType", args.itemType).eq("itemId", args.itemId)
      )
      .first();

    if (existing && existing.userId === user._id) {
      return existing._id;
    }

    return await ctx.db.insert("bookmarks", {
      userId: user._id,
      itemType: args.itemType,
      itemId: args.itemId,
      notes: args.notes,
      tags: args.tags ?? [],
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("bookmarks"),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const bookmark = await ctx.db.get(args.id);
    if (!bookmark) {
      throw new Error("Bookmark not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || bookmark.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: {
    itemType: v.union(
      v.literal("paper"),
      v.literal("insight"),
      v.literal("startup"),
      v.literal("problem"),
      v.literal("solution")
    ),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_item", (q) =>
        q.eq("itemType", args.itemType).eq("itemId", args.itemId)
      )
      .first();

    if (bookmark && bookmark.userId === user._id) {
      await ctx.db.delete(bookmark._id);
    }
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const byType = bookmarks.reduce(
      (acc, b) => {
        acc[b.itemType] = (acc[b.itemType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: bookmarks.length,
      byType,
    };
  },
});
