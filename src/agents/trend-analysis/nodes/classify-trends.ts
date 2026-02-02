/**
 * Classify Trends Node
 * Classifies trends based on metrics and topic signals
 */

import { v4 as uuidv4 } from "uuid";
import type { TrendAnalysisStateType } from "../state";
import type {
  ClassifiedTrend,
  TrendStatus,
  TrendMetrics,
  Paper,
} from "../../tools/types";

/**
 * Classify trend status based on metrics
 */
function classifyTrendStatus(params: {
  growthRate: number;
  paperCount: number;
  momentum: number;
}): TrendStatus {
  const { growthRate, paperCount, momentum } = params;

  // Breakthrough: sudden spike (>100% growth with high momentum)
  if (growthRate > 1.0 && momentum > 0.5) {
    return "breakthrough";
  }

  // Emerging: >50% growth with low base
  if (growthRate > 0.5 && paperCount < 100) {
    return "emerging";
  }

  // Growing: 20-50% sustained growth
  if (growthRate >= 0.2 && growthRate <= 0.5) {
    return "growing";
  }

  // Declining: negative growth
  if (growthRate < 0) {
    return "declining";
  }

  // Stable: <20% change
  return "stable";
}

/**
 * Build time series from papers
 */
function buildTimeSeries(
  papers: Paper[],
  period: "daily" | "weekly" | "monthly"
): { date: string; paperCount: number }[] {
  if (papers.length === 0) return [];

  const bins = new Map<string, number>();

  papers.forEach((paper) => {
    const date = new Date(paper.publishedDate);
    const key =
      period === "monthly"
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    bins.set(key, (bins.get(key) || 0) + 1);
  });

  return Array.from(bins.entries())
    .map(([date, paperCount]) => ({ date, paperCount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Filter papers by keywords
 */
function filterPapersByKeywords(papers: Paper[], keywords: string[]): Paper[] {
  if (keywords.length === 0) return [];

  return papers.filter((p) =>
    keywords.some(
      (kw) =>
        p.title.toLowerCase().includes(kw.toLowerCase()) ||
        p.abstract.toLowerCase().includes(kw.toLowerCase())
    )
  );
}

/**
 * Classify trends node implementation
 * Creates classified trends from topics and metrics
 */
export async function classifyTrendsNode(
  state: TrendAnalysisStateType
): Promise<Partial<TrendAnalysisStateType>> {
  console.log("[classify_trends] Classifying trends...");

  if (!state.signals || !state.metrics) {
    return {
      trends: [],
      status: "forecasting",
      progress: {
        ...state.progress,
        currentNode: "classify_trends",
        trendsClassified: 0,
      },
    };
  }

  const trends: ClassifiedTrend[] = [];

  // Create trend for each significant topic
  for (const topic of state.signals.topics) {
    if (topic.paperCount < 3) continue;

    // Filter papers belonging to this topic (by keyword match)
    const topicPapers = filterPapersByKeywords(state.papers, topic.keywords);
    const prevTopicPapers = filterPapersByKeywords(
      state.previousPeriodPapers,
      topic.keywords
    );

    // Compute topic-specific growth rate
    const topicGrowthRate =
      prevTopicPapers.length > 0
        ? (topicPapers.length - prevTopicPapers.length) / prevTopicPapers.length
        : topicPapers.length > 0
          ? 1
          : 0;

    // Classify trend status
    const status = classifyTrendStatus({
      growthRate: topicGrowthRate,
      paperCount: topicPapers.length,
      momentum: state.metrics.momentum,
    });

    // Build time series
    const timeSeries = buildTimeSeries(topicPapers, state.period);

    // Compute topic-specific author count
    const topicAuthorSet = new Set<string>();
    topicPapers.forEach((p) =>
      p.authors.forEach((a: { name: string }) => topicAuthorSet.add(a.name))
    );

    // Create topic-specific metrics
    const topicMetrics: TrendMetrics = {
      ...state.metrics,
      paperCount: topicPapers.length,
      paperCountPrevPeriod: prevTopicPapers.length,
      growthRate: topicGrowthRate,
      authorCount: topicAuthorSet.size,
    };

    trends.push({
      id: uuidv4(),
      name: topic.label,
      description: `Research trend in ${topic.label} with ${topicPapers.length} papers`,
      status,
      keywords: topic.keywords,
      categories: Array.from(new Set(topicPapers.flatMap((p) => p.categories))),
      metrics: topicMetrics,
      timeSeries,
      topPapers: topicPapers
        .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
        .slice(0, 5)
        .map((p) => p.id),
      relatedTrends: [],
    });
  }

  // Find related trends based on keyword overlap
  for (const trend of trends) {
    trend.relatedTrends = trends
      .filter((t) => t.id !== trend.id)
      .filter((t) => t.keywords.some((k) => trend.keywords.includes(k)))
      .map((t) => t.id);
  }

  console.log(`[classify_trends] Classified ${trends.length} trends`);

  return {
    trends,
    status: "forecasting",
    progress: {
      ...state.progress,
      currentNode: "classify_trends",
      trendsClassified: trends.length,
    },
  };
}
