import { z } from "zod";
import HDBSCAN from "hdbscanjs";
import type { ProblemDiscoveryStateType } from "../state";
import type { Problem, ProblemCluster } from "../types";
import { CONFIG } from "../config";
import { batchGenerateEmbeddings } from "../utils/embedding-client";
import { openrouter } from "../utils/openrouter-client";

const ClusterThemeSchema = z.object({
  theme: z.string(),
  description: z.string(),
});

async function generateClusterTheme(
  problems: Problem[]
): Promise<{ theme: string; description: string }> {
  const statements = problems.map((p) => p.statement).join("\n- ");

  const prompt = `Analyze these related startup problems and generate a theme:

Problems:
- ${statements}

Generate:
1. theme: A short (2-5 words) theme that captures the common issue
2. description: A 1-2 sentence description of this problem cluster

Respond with JSON:
{
  "theme": "...",
  "description": "..."
}`;

  const response = await openrouter.chatWithRetry({
    model: CONFIG.clustering.model,
    messages: [
      {
        role: "system",
        content:
          "You are an expert at categorizing and theming startup problems. Always respond with valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { theme: "Uncategorized", description: "Mixed problems" };
  }

  try {
    const parsed = JSON.parse(content);
    const validated = ClusterThemeSchema.parse(parsed);
    return validated;
  } catch {
    return { theme: "Uncategorized", description: "Mixed problems" };
  }
}

function aggregateMetadata(problems: Problem[]): {
  industries: string[];
  fundingStages: string[];
} {
  const industries = new Set<string>();
  const fundingStages = new Set<string>();

  for (const problem of problems) {
    for (const tag of problem.tags) {
      if (
        [
          "fintech",
          "healthtech",
          "edtech",
          "devtools",
          "cybersecurity",
          "ai",
          "ml",
          "e-commerce",
          "logistics",
          "proptech",
          "legaltech",
        ].some((ind) => tag.toLowerCase().includes(ind))
      ) {
        industries.add(tag.toLowerCase());
      }
      if (
        ["seed", "series-a", "series-b", "series-c"].some((stage) =>
          tag.toLowerCase().includes(stage)
        )
      ) {
        fundingStages.add(tag.toLowerCase());
      }
    }
  }

  return {
    industries: Array.from(industries),
    fundingStages: Array.from(fundingStages),
  };
}

export async function clusterProblemsNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  const { extractedProblems } = state;
  const errors: ProblemDiscoveryStateType["errors"] = [];
  const totalTokensUsed = 0;
  let apiCalls = 0;

  if (extractedProblems.length < CONFIG.clustering.minProblemsForClustering) {
    return {
      clusteredProblems: [],
      errors,
      status: "clustering",
      progress: {
        current: 5,
        total: 6,
        stage: `Skipping clustering: only ${extractedProblems.length} problems (minimum ${CONFIG.clustering.minProblemsForClustering})`,
      },
      metrics: {
        startTime: state.metrics.startTime,
        searchQueries: state.metrics.searchQueries,
        rawResults: state.metrics.rawResults,
        extractedProblems: state.extractedProblems.length,
        implicitSignals: state.implicitSignals.length,
        clusters: 0,
        apiCalls: 0,
        tokensUsed: 0,
      },
    };
  }

  try {
    const statements = extractedProblems.map((p) => p.statement);
    const embeddings = await batchGenerateEmbeddings(statements);
    apiCalls++;

    const hdbscan = new HDBSCAN({
      minClusterSize: CONFIG.clustering.minClusterSize,
      minSamples: CONFIG.clustering.minSamples,
      metric: "cosine",
    });

    const clusterLabels = hdbscan.fit(embeddings);

    const clusterMap = new Map<number, number[]>();
    clusterLabels.forEach((label: number, idx: number) => {
      if (label === -1) return;

      if (!clusterMap.has(label)) {
        clusterMap.set(label, []);
      }
      clusterMap.get(label)!.push(idx);
    });

    const clusters: ProblemCluster[] = [];

    for (const [, problemIndices] of Array.from(clusterMap.entries())) {
      const clusterProblems = problemIndices.map(
        (i: number) => extractedProblems[i]
      );

      const { theme, description } =
        await generateClusterTheme(clusterProblems);
      apiCalls++;

      const { industries, fundingStages } = aggregateMetadata(clusterProblems);

      clusters.push({
        theme,
        description,
        problemIds: problemIndices.map((i: number) => `problem-${i}`),
        size: clusterProblems.length,
        industries,
        fundingStages,
        growthRate: 0,
      });
    }

    clusters.sort((a, b) => b.size - a.size);

    return {
      clusteredProblems: clusters,
      errors,
      status: "clustering",
      progress: {
        current: 5,
        total: 6,
        stage: `Clustered ${extractedProblems.length} problems into ${clusters.length} clusters`,
      },
      metrics: {
        startTime: state.metrics.startTime,
        searchQueries: state.metrics.searchQueries,
        rawResults: state.metrics.rawResults,
        extractedProblems: state.extractedProblems.length,
        implicitSignals: state.implicitSignals.length,
        clusters: clusters.length,
        apiCalls,
        tokensUsed: totalTokensUsed,
      },
    };
  } catch (error) {
    errors.push({
      node: "cluster_problems",
      error: error instanceof Error ? error.message : String(error),
      recoverable: true,
      timestamp: Date.now(),
    });

    return {
      clusteredProblems: [],
      errors,
      status: "clustering",
      progress: {
        current: 5,
        total: 6,
        stage: "Clustering failed",
      },
      metrics: {
        startTime: state.metrics.startTime,
        searchQueries: state.metrics.searchQueries,
        rawResults: state.metrics.rawResults,
        extractedProblems: state.extractedProblems.length,
        implicitSignals: state.implicitSignals.length,
        clusters: 0,
        apiCalls,
        tokensUsed: totalTokensUsed,
      },
    };
  }
}
