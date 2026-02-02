import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { ProblemDiscoveryStateType } from "../state";
import type { SavedProblem, SavedSignal, SavedCluster } from "../types";
import { mapSignalTypeToSchema } from "../types";
import { generateEmbedding } from "../utils/embedding-client";

export async function saveToDbNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  const { extractedProblems, implicitSignals, clusteredProblems } = state;
  const savedProblems: SavedProblem[] = [];
  const savedSignals: SavedSignal[] = [];
  const savedClusters: SavedCluster[] = [];
  const errors: ProblemDiscoveryStateType["errors"] = [];
  let apiCalls = 0;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return {
      errors: [
        {
          node: "save_to_db",
          error: "NEXT_PUBLIC_CONVEX_URL not configured",
          recoverable: false,
          timestamp: Date.now(),
        },
      ],
      status: "failed",
      progress: {
        current: 6,
        total: 6,
        stage: "Failed: Missing Convex URL",
      },
      metrics: state.metrics,
    };
  }

  const client = new ConvexHttpClient(convexUrl);

  const startups = await client.query(api.startups.list, { limit: 100 });
  const defaultStartupId = startups[0]?._id;

  if (!defaultStartupId) {
    return {
      errors: [
        {
          node: "save_to_db",
          error: "No startups found in database to associate problems with",
          recoverable: false,
          timestamp: Date.now(),
        },
      ],
      status: "failed",
      progress: {
        current: 6,
        total: 6,
        stage: "Failed: No startups in database",
      },
      metrics: state.metrics,
    };
  }

  for (const problem of extractedProblems) {
    try {
      const embedding = await generateEmbedding(
        `${problem.statement} ${problem.description}`
      );
      apiCalls++;

      const problemId = await client.mutation(api.problems.create, {
        startupId: problem.startupId ?? defaultStartupId,
        title: problem.statement,
        description: problem.description,
        category: problem.category,
        severity: problem.severity,
        evidence: problem.evidence,
        tags: problem.tags,
        embedding,
      });

      savedProblems.push({
        id: problemId,
        title: problem.statement,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      errors.push({
        node: "save_to_db",
        error: `Failed to save problem "${problem.statement}": ${error instanceof Error ? error.message : String(error)}`,
        recoverable: true,
        timestamp: Date.now(),
      });
    }
  }

  for (const signal of implicitSignals) {
    try {
      const signalId = await client.mutation(api.implicitSignals.create, {
        startupId: signal.startupId ?? defaultStartupId,
        signalType: mapSignalTypeToSchema(signal.signalType),
        title: signal.inferredProblem.slice(0, 100),
        content: signal.inferredProblem,
        sourceUrl: signal.evidence.url,
        inferredIntent: signal.inferredProblem,
        confidence: signal.confidence,
        keywords: signal.keywords,
      });

      savedSignals.push({
        id: signalId,
        signalType: signal.signalType,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      errors.push({
        node: "save_to_db",
        error: `Failed to save signal: ${error instanceof Error ? error.message : String(error)}`,
        recoverable: true,
        timestamp: Date.now(),
      });
    }
  }

  for (const cluster of clusteredProblems) {
    try {
      const clusterId = await client.mutation(api.problemClusters.create, {
        theme: cluster.theme,
        description: cluster.description,
        problemIds: savedProblems
          .slice(0, cluster.size)
          .map((p) => p.id.toString()),
        size: cluster.size,
        industries: cluster.industries,
        fundingStages: cluster.fundingStages,
        growthRate: cluster.growthRate,
      });

      savedClusters.push({
        id: clusterId,
        theme: cluster.theme,
      });
    } catch (error) {
      errors.push({
        node: "save_to_db",
        error: `Failed to save cluster "${cluster.theme}": ${error instanceof Error ? error.message : String(error)}`,
        recoverable: true,
        timestamp: Date.now(),
      });
    }
  }

  const endTime = Date.now();

  return {
    savedProblems,
    savedSignals,
    savedClusters,
    errors,
    status: "complete",
    progress: {
      current: 6,
      total: 6,
      stage: `Saved ${savedProblems.length} problems, ${savedSignals.length} signals, ${savedClusters.length} clusters`,
    },
    metrics: {
      startTime: state.metrics.startTime,
      endTime,
      searchQueries: state.metrics.searchQueries,
      rawResults: state.metrics.rawResults,
      extractedProblems: savedProblems.length,
      implicitSignals: savedSignals.length,
      clusters: savedClusters.length,
      apiCalls,
      tokensUsed: state.metrics.tokensUsed,
    },
  };
}
