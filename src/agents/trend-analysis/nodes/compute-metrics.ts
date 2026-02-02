/**
 * Compute Metrics Node
 * Calculates trend metrics including growth rate, momentum, and trend score
 */

import type { TrendAnalysisStateType } from "../state";
import type { TrendMetrics } from "../../tools/types";

/**
 * Compute the composite trend score from individual metrics
 */
function computeTrendScore(params: {
  growthRate: number;
  momentum: number;
  authorCount: number;
  avgCitations: number;
  crossCategoryScore: number;
}): number {
  const weights = {
    growthRate: 0.35,
    momentum: 0.25,
    authorParticipation: 0.15,
    citations: 0.15,
    crossCategory: 0.1,
  };

  // Normalize components to 0-1 range
  const normalizedGrowth =
    Math.min(Math.max(params.growthRate, -1), 2) / 2 + 0.5;
  const normalizedMomentum = (params.momentum + 1) / 2;
  const normalizedAuthors = Math.min(params.authorCount / 100, 1);
  const normalizedCitations = Math.min(params.avgCitations / 50, 1);

  return (
    (normalizedGrowth * weights.growthRate +
      normalizedMomentum * weights.momentum +
      normalizedAuthors * weights.authorParticipation +
      normalizedCitations * weights.citations +
      params.crossCategoryScore * weights.crossCategory) *
    100
  );
}

/**
 * Compute metrics node implementation
 * Calculates various trend metrics from loaded papers
 */
export async function computeMetricsNode(
  state: TrendAnalysisStateType
): Promise<Partial<TrendAnalysisStateType>> {
  console.log("[compute_metrics] Computing trend metrics...");

  const currentPapers = state.papers;
  const previousPapers = state.previousPeriodPapers;

  const paperCount = currentPapers.length;
  const paperCountPrevPeriod = previousPapers.length;

  // Growth rate: (current - previous) / previous
  const growthRate =
    paperCountPrevPeriod > 0
      ? (paperCount - paperCountPrevPeriod) / paperCountPrevPeriod
      : paperCount > 0
        ? 1
        : 0;

  // Momentum: second derivative of paper count (simplified heuristic)
  // Positive momentum = accelerating growth, negative = decelerating
  const momentum =
    growthRate > 0.5
      ? 0.8
      : growthRate > 0.2
        ? 0.5
        : growthRate > 0
          ? 0.2
          : growthRate < -0.2
            ? -0.5
            : 0;

  // Author participation: count unique authors
  const authorSet = new Set<string>();
  currentPapers.forEach((p) => p.authors.forEach((a) => authorSet.add(a.name)));
  const authorCount = authorSet.size;

  // Average citations
  const avgCitations =
    paperCount > 0
      ? currentPapers.reduce((sum, p) => sum + (p.citationCount || 0), 0) /
        paperCount
      : 0;

  // Cross-category emergence score
  // Higher score = topic appears in multiple categories
  const categoryCount = new Set(currentPapers.flatMap((p) => p.categories))
    .size;
  const crossCategoryScore = Math.min(categoryCount / 5, 1);

  // Composite trend score (weighted combination)
  const trendScore = computeTrendScore({
    growthRate,
    momentum,
    authorCount,
    avgCitations,
    crossCategoryScore,
  });

  const metrics: TrendMetrics = {
    paperCount,
    paperCountPrevPeriod,
    growthRate,
    momentum,
    authorCount,
    avgCitations,
    crossCategoryScore,
    trendScore,
  };

  console.log(
    `[compute_metrics] Growth rate: ${(growthRate * 100).toFixed(1)}%, Score: ${trendScore.toFixed(2)}`
  );

  return {
    metrics,
    status: "classifying",
    progress: {
      ...state.progress,
      currentNode: "compute_metrics",
    },
  };
}
