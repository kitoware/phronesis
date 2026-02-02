/**
 * Generate Forecast Node
 * Uses LLM to generate trend forecasts
 */

import type { TrendAnalysisStateType } from "../state";
import type { TrendForecast } from "../../tools/types";
import { openrouter } from "../../tools/llm/openrouter";
import { z } from "zod";

// Forecast response schema
const ForecastSchema = z.object({
  direction: z.enum(["up", "down", "stable"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  predictedGrowthRate: z.number(),
});

/**
 * Generate forecast for a single trend using LLM
 */
async function generateTrendForecast(
  trend: {
    name: string;
    status: string;
    metrics: {
      paperCount: number;
      paperCountPrevPeriod: number;
      growthRate: number;
    };
    keywords: string[];
    timeSeries: { date: string; paperCount: number }[];
  },
  period: string
): Promise<{
  direction: "up" | "down" | "stable";
  confidence: number;
  reasoning: string;
  predictedGrowthRate: number;
}> {
  const timeSeriesStr = trend.timeSeries
    .slice(-10)
    .map((t) => `${t.date}: ${t.paperCount} papers`)
    .join("\n");

  const response = await openrouter.chat({
    model: "anthropic/claude-3.5-sonnet",
    messages: [
      {
        role: "user",
        content: `Analyze this research trend and predict its future direction.

Trend: ${trend.name}
Status: ${trend.status}
Current paper count: ${trend.metrics.paperCount}
Previous period: ${trend.metrics.paperCountPrevPeriod}
Growth rate: ${(trend.metrics.growthRate * 100).toFixed(1)}%
Keywords: ${trend.keywords.join(", ")}

Time series (last 10 points):
${timeSeriesStr || "No time series data available"}

Predict the trend direction for the next ${period}:
- direction: "up", "down", or "stable"
- confidence: 0-1 (how confident in the prediction)
- reasoning: Brief explanation (1-2 sentences)
- predictedGrowthRate: Expected growth rate as decimal (e.g., 0.25 for 25%)

Return as JSON.`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  const result = ForecastSchema.safeParse(parsed);

  if (result.success) {
    return result.data;
  }

  // Fallback to heuristic if parsing fails
  return {
    direction:
      trend.metrics.growthRate > 0.1
        ? "up"
        : trend.metrics.growthRate < -0.1
          ? "down"
          : "stable",
    confidence: 0.5,
    reasoning: "Based on historical growth rate",
    predictedGrowthRate: trend.metrics.growthRate,
  };
}

/**
 * Generate forecast node implementation
 * Generates LLM-based forecasts for each classified trend
 */
export async function generateForecastNode(
  state: TrendAnalysisStateType
): Promise<Partial<TrendAnalysisStateType>> {
  console.log(
    `[generate_forecast] Generating forecasts for ${state.trends.length} trends...`
  );

  if (state.trends.length === 0) {
    return {
      forecasts: [],
      status: "saving",
      progress: {
        ...state.progress,
        currentNode: "generate_forecast",
        forecastsGenerated: 0,
      },
    };
  }

  const forecasts: TrendForecast[] = [];

  for (const trend of state.trends) {
    try {
      const forecast = await generateTrendForecast(trend, state.period);

      forecasts.push({
        trendId: trend.id,
        direction: forecast.direction,
        confidence: forecast.confidence,
        reasoning: forecast.reasoning,
        predictedGrowthRate: forecast.predictedGrowthRate,
        timeHorizon: state.period,
      });
    } catch (error) {
      console.error(
        `[generate_forecast] Failed to forecast trend ${trend.id}:`,
        error
      );

      // Fallback to simple heuristic
      forecasts.push({
        trendId: trend.id,
        direction:
          trend.metrics.growthRate > 0.1
            ? "up"
            : trend.metrics.growthRate < -0.1
              ? "down"
              : "stable",
        confidence: 0.5,
        reasoning: "Based on historical growth rate (fallback)",
        predictedGrowthRate: trend.metrics.growthRate,
        timeHorizon: state.period,
      });
    }
  }

  console.log(`[generate_forecast] Generated ${forecasts.length} forecasts`);

  return {
    forecasts,
    status: "saving",
    progress: {
      ...state.progress,
      currentNode: "generate_forecast",
      forecastsGenerated: forecasts.length,
    },
  };
}
