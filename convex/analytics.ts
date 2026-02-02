import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get dashboard metrics for the analytics page
 */
export const getDashboardMetrics = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Papers processed today
    const allPapers = await ctx.db.query("papers").collect();
    const papersToday = allPapers.filter(
      (p) => p.processedAt && p.processedAt >= oneDayAgo
    );
    const papersThisWeek = allPapers.filter(
      (p) => p.processedAt && p.processedAt >= oneWeekAgo
    );

    // Trends
    const allTrends = await ctx.db.query("trends").collect();

    const emergingTrends = allTrends.filter((t) => t.status === "emerging");
    const breakthroughs = allTrends.filter(
      (t) => t.status === "breakthrough" && t.computedAt >= oneWeekAgo
    );

    // Agent runs
    const recentRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_created")
      .order("desc")
      .take(100);

    const runsToday = recentRuns.filter((r) => r.createdAt >= oneDayAgo);
    const successfulRuns = runsToday.filter((r) => r.status === "completed");
    const failedRuns = runsToday.filter((r) => r.status === "failed");

    // Startups and problems
    const startups = await ctx.db.query("startups").collect();
    const problems = await ctx.db.query("startupProblems").collect();
    const researchLinks = await ctx.db.query("researchLinks").collect();

    return {
      papers: {
        total: allPapers.length,
        processedToday: papersToday.length,
        processedThisWeek: papersThisWeek.length,
        pending: allPapers.filter((p) => p.processingStatus === "pending")
          .length,
      },
      trends: {
        total: allTrends.length,
        emerging: emergingTrends.length,
        breakthroughs: breakthroughs.length,
        growing: allTrends.filter((t) => t.status === "growing").length,
      },
      agents: {
        runsToday: runsToday.length,
        successfulToday: successfulRuns.length,
        failedToday: failedRuns.length,
        successRate:
          runsToday.length > 0
            ? (successfulRuns.length / runsToday.length) * 100
            : 0,
      },
      startups: {
        total: startups.length,
        problems: problems.length,
        researchLinks: researchLinks.length,
        recentlyUpdated: startups.filter((s) => s.lastUpdated >= oneWeekAgo)
          .length,
      },
    };
  },
});

/**
 * Get trend analytics over time
 */
export const getTrendAnalytics = query({
  args: {
    period: v.optional(
      v.union(v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"))
    ),
  },
  handler: async (ctx, args) => {
    const trends = await ctx.db.query("trends").collect();

    // Group trends by status
    const statusCounts = {
      emerging: 0,
      growing: 0,
      stable: 0,
      declining: 0,
      breakthrough: 0,
    };

    trends.forEach((t) => {
      if (t.status && t.status in statusCounts) {
        statusCounts[t.status as keyof typeof statusCounts]++;
      }
    });

    // Get top trends by trend score
    const sortedByScore = trends
      .filter((t) => t.metrics?.trendScore != null)
      .sort(
        (a, b) => (b.metrics?.trendScore ?? 0) - (a.metrics?.trendScore ?? 0)
      )
      .slice(0, 10);

    // Get category distribution
    const categoryDistribution = new Map<string, number>();
    trends.forEach((t) => {
      categoryDistribution.set(
        t.category,
        (categoryDistribution.get(t.category) ?? 0) + 1
      );
    });

    return {
      statusCounts,
      topTrends: sortedByScore.map((t) => ({
        name: t.name ?? t.topic,
        category: t.category,
        status: t.status,
        trendScore: t.metrics?.trendScore ?? 0,
        growthRate: t.metrics?.growthRate ?? 0,
      })),
      categoryDistribution: Array.from(categoryDistribution.entries()).map(
        ([category, count]) => ({
          category,
          count,
        })
      ),
    };
  },
});

/**
 * Get agent performance metrics
 */
export const getAgentPerformance = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const runs = await ctx.db
      .query("agentRuns")
      .filter((q) => q.gte(q.field("createdAt"), cutoff))
      .collect();

    // Group by agent type
    const byType = new Map<
      string,
      { completed: number; failed: number; avgDuration: number }
    >();

    runs.forEach((run) => {
      const type = run.agentType;
      if (!byType.has(type)) {
        byType.set(type, { completed: 0, failed: 0, avgDuration: 0 });
      }

      const stats = byType.get(type)!;
      if (run.status === "completed") {
        stats.completed++;
        if (run.metrics?.duration) {
          stats.avgDuration =
            (stats.avgDuration * (stats.completed - 1) + run.metrics.duration) /
            stats.completed;
        }
      } else if (run.status === "failed") {
        stats.failed++;
      }
    });

    return {
      totalRuns: runs.length,
      byType: Array.from(byType.entries()).map(([agentType, stats]) => ({
        agentType,
        ...stats,
        successRate:
          stats.completed + stats.failed > 0
            ? (stats.completed / (stats.completed + stats.failed)) * 100
            : 0,
      })),
    };
  },
});
