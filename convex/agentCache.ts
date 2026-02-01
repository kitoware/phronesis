import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {
    namespace: v.string(),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("agentCache")
      .withIndex("by_key", (q) =>
        q.eq("namespace", args.namespace).eq("key", args.key)
      )
      .first();

    if (!entry) {
      return null;
    }

    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      return null;
    }

    return entry.value;
  },
});

export const set = mutation({
  args: {
    namespace: v.string(),
    key: v.string(),
    value: v.any(),
    ttlMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = args.ttlMs ? now + args.ttlMs : undefined;

    const existing = await ctx.db
      .query("agentCache")
      .withIndex("by_key", (q) =>
        q.eq("namespace", args.namespace).eq("key", args.key)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        expiresAt,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("agentCache", {
      namespace: args.namespace,
      key: args.key,
      value: args.value,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: {
    namespace: v.string(),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("agentCache")
      .withIndex("by_key", (q) =>
        q.eq("namespace", args.namespace).eq("key", args.key)
      )
      .first();

    if (entry) {
      await ctx.db.delete(entry._id);
      return true;
    }

    return false;
  },
});

export const cleanup = mutation({
  args: {
    namespace: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const expired = await ctx.db
      .query("agentCache")
      .withIndex("by_expires")
      .filter((q) =>
        q.and(
          q.neq(q.field("expiresAt"), undefined),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .collect();

    const toDelete = args.namespace
      ? expired.filter((e) => e.namespace === args.namespace)
      : expired;

    for (const entry of toDelete) {
      await ctx.db.delete(entry._id);
    }

    return toDelete.length;
  },
});

export const clearNamespace = mutation({
  args: {
    namespace: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("agentCache")
      .withIndex("by_key", (q) => q.eq("namespace", args.namespace))
      .collect();

    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }

    return entries.length;
  },
});

export const list = query({
  args: {
    namespace: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const entries = await ctx.db
      .query("agentCache")
      .withIndex("by_key", (q) => q.eq("namespace", args.namespace))
      .collect();

    const active = entries.filter((e) => !e.expiresAt || e.expiresAt > now);

    if (args.limit) {
      return active.slice(0, args.limit);
    }

    return active;
  },
});
