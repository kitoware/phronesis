/**
 * Save Trends Node
 * Persists classified trends and forecasts to Convex
 */

import type { TrendAnalysisStateType } from "../state";
import { convexMutation } from "../../tools/data/convex";

/**
 * Save trends node implementation
 * Upserts trends to Convex database
 */
export async function saveTrendsNode(
  state: TrendAnalysisStateType
): Promise<Partial<TrendAnalysisStateType>> {
  console.log(`[save_trends] Saving ${state.trends.length} trends...`);

  if (state.trends.length === 0) {
    return {
      savedTrendIds: [],
      status: "complete",
      progress: {
        ...state.progress,
        currentNode: "save_trends",
      },
    };
  }

  const savedTrendIds: string[] = [];

  for (const trend of state.trends) {
    try {
      // Find matching forecast
      const forecast = state.forecasts.find((f) => f.trendId === trend.id);

      // Upsert trend to Convex
      const trendId = await convexMutation("trends:upsert", {
        trendId: trend.id,
        name: trend.name,
        description: trend.description,
        status: trend.status,
        category: trend.categories[0] || state.category,
        topic: trend.name,
        period: state.period,
        startDate: new Date(
          Date.now() -
            (state.period === "daily"
              ? 1
              : state.period === "weekly"
                ? 7
                : 30) *
              24 *
              60 *
              60 *
              1000
        )
          .toISOString()
          .split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        keywords: trend.keywords,
        metrics: {
          paperCount: trend.metrics.paperCount,
          paperCountPrevPeriod: trend.metrics.paperCountPrevPeriod,
          growthRate: trend.metrics.growthRate,
          authorCount: trend.metrics.authorCount,
          avgCitations: trend.metrics.avgCitations,
          trendScore: trend.metrics.trendScore,
          institutionCount: 0, // Not computed in this implementation
        },
        timeSeries: trend.timeSeries.map((t) => ({
          date: t.date,
          value: t.paperCount,
        })),
        topPapers: [], // Would need paper ID conversion
        topAuthors: [], // Would need author extraction
        relatedTopics: trend.keywords.slice(0, 5),
        relatedTrends: trend.relatedTrends,
        forecast: forecast
          ? {
              confidence: forecast.confidence,
              direction: forecast.direction,
            }
          : undefined,
      });

      savedTrendIds.push(trendId as string);
    } catch (error) {
      console.error(`[save_trends] Failed to save trend ${trend.id}:`, error);
    }
  }

  console.log(`[save_trends] Saved ${savedTrendIds.length} trends`);

  return {
    savedTrendIds,
    status: "complete",
    progress: {
      ...state.progress,
      currentNode: "save_trends",
    },
  };
}
