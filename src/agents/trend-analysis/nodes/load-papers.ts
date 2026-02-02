/**
 * Load Papers Node
 * Fetches papers from Convex for the specified category and period
 */

import type { TrendAnalysisStateType } from "../state";
import type { Paper } from "../../tools/types";
import { convexQuery } from "../../tools/data/convex";

/**
 * Transform a Convex paper document to the Paper interface
 */
function transformPaper(doc: Record<string, unknown>): Paper {
  return {
    id: doc._id as string,
    arxivId: doc.arxivId as string,
    title: doc.title as string,
    abstract: doc.abstract as string,
    authors:
      (doc.authors as Array<{ name: string; affiliations?: string[] }>) || [],
    categories: (doc.categories as string[]) || [],
    primaryCategory: doc.primaryCategory as string,
    publishedDate: doc.publishedDate as string,
    citationCount: doc.citationCount as number | undefined,
  };
}

/**
 * Calculate date range for the specified period
 */
function getDateRange(period: "daily" | "weekly" | "monthly"): {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
} {
  const now = new Date();
  const periodDays = period === "daily" ? 1 : period === "weekly" ? 7 : 30;

  const currentEnd = now;
  const currentStart = new Date(
    now.getTime() - periodDays * 24 * 60 * 60 * 1000
  );
  const previousEnd = currentStart;
  const previousStart = new Date(
    currentStart.getTime() - periodDays * 24 * 60 * 60 * 1000
  );

  return { currentStart, currentEnd, previousStart, previousEnd };
}

/**
 * Load papers node implementation
 * Fetches current and previous period papers for trend comparison
 */
export async function loadPapersNode(
  state: TrendAnalysisStateType
): Promise<Partial<TrendAnalysisStateType>> {
  console.log(
    `[load_papers] Loading papers for ${state.category} (${state.period})...`
  );

  try {
    const { currentStart, currentEnd, previousStart, previousEnd } =
      getDateRange(state.period);

    // Fetch current period papers
    const currentPapers = await convexQuery("papers:byCategory", {
      category: state.category,
      startDate: currentStart.toISOString().split("T")[0],
      endDate: currentEnd.toISOString().split("T")[0],
      limit: 1000,
    });

    // Fetch previous period papers for comparison
    const previousPapers = await convexQuery("papers:byCategory", {
      category: state.category,
      startDate: previousStart.toISOString().split("T")[0],
      endDate: previousEnd.toISOString().split("T")[0],
      limit: 1000,
    });

    const papersArray = Array.isArray(currentPapers) ? currentPapers : [];
    const previousPapersArray = Array.isArray(previousPapers)
      ? previousPapers
      : [];
    const papers = papersArray.map(transformPaper);
    const previousPeriodPapers = previousPapersArray.map(transformPaper);

    console.log(
      `[load_papers] Loaded ${papers.length} current papers, ${previousPeriodPapers.length} previous`
    );

    return {
      papers,
      previousPeriodPapers,
      status: "extracting_signals",
      progress: {
        ...state.progress,
        currentNode: "load_papers",
        papersLoaded: papers.length,
      },
    };
  } catch (error) {
    console.error("[load_papers] Failed to load papers:", error);
    return {
      status: "failed",
      errors: [
        {
          node: "load_papers",
          error: `Failed to load papers: ${error}`,
          timestamp: new Date(),
          recoverable: true,
        },
      ],
    };
  }
}
