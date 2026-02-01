# Plan 6: Trends & Analytics

**Timeline:** Weeks 25-28 (parallel)
**Dependencies:** plan_1 (Foundation & Scaffolding), plan_7 (Agent Tools)
**Uses Data From:** plan_3 (Research Agent)
**Parallel With:** plan_2, plan_3, plan_4, plan_5

---

## Overview

This plan implements the trend detection system, analytics dashboards, and success metrics tracking for the ArXiv Research Intelligence Platform.

**Architecture:** LangGraph StateGraph with streaming updates

---

## Scope

- Trend detection system
- Signal extraction (TF-IDF, KeyBERT)
- Topic clustering (BERTopic, LDA)
- Trend visualization (Recharts, D3.js)
- Success metrics tracking
- Analytics dashboard

---

## Technology Stack

| Technology         | Purpose                                      |
| ------------------ | -------------------------------------------- |
| **LangGraph**      | Agent orchestration with streaming events    |
| **OpenRouter**     | Unified LLM provider for trend analysis      |
| **Convex**         | Data persistence and real-time subscriptions |
| **TF-IDF/KeyBERT** | Keyword extraction                           |
| **BERTopic**       | Topic clustering                             |
| **Recharts**       | Trend visualization                          |

---

## Key Deliverables

1. LangGraph StateGraph for trend computation (RDA-001)
2. Signal extraction node (RDA-002)
3. Trend metrics computation node (RDA-003)
4. Trend forecasting node (RDA-004)
5. Trend visualization components (RDA-005)
6. Convex functions: trends, analytics
7. Shared tools integration from Plan 7

---

## LangGraph Architecture

### Agent Orchestration Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│           TREND ANALYSIS AGENT (LangGraph StateGraph)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ORCHESTRATOR STATE                       │ │
│  │  • category: string                                         │ │
│  │  • period: "daily" | "weekly" | "monthly"                   │ │
│  │  • papers: Paper[]                                          │ │
│  │  • signals: TrendSignals                                    │ │
│  │  • metrics: TrendMetrics                                    │ │
│  │  • trends: ClassifiedTrend[]                                │ │
│  │  • forecast: TrendForecast                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   StateGraph FLOW                         │   │
│  │                                                           │   │
│  │   START                                                   │   │
│  │     │                                                     │   │
│  │     ▼                                                     │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │  load_papers    │ ──► Fetch papers for category/period │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │ extract_signals │ ──► TF-IDF, KeyBERT, BERTopic        │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │ compute_metrics │ ──► Growth rate, momentum, etc.      │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │ classify_trends │ ──► Emerging/growing/stable/declining│   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │generate_forecast│ ──► LLM-based trend prediction       │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │  save_trends    │ ──► Persist to Convex                │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │         END                                               │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Checkpointing: ConvexCheckpointer (thread-based persistence)   │
│  Streaming: Real-time progress updates via LangGraph events     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## LangGraph Implementation

### State Schema Definition

```typescript
// src/agents/trend-analysis/state.ts
import { Annotation } from "@langchain/langgraph";

// Type definitions
interface Paper {
  id: string;
  arxivId: string;
  title: string;
  abstract: string;
  authors: { name: string; affiliation?: string }[];
  categories: string[];
  publishedDate: Date;
  citationCount?: number;
  embedding?: number[];
}

interface TrendSignals {
  keywords: KeywordSignal[];
  topics: TopicSignal[];
  entities: EntitySignal[];
  temporalBins: TemporalBin[];
}

interface KeywordSignal {
  keyword: string;
  score: number; // TF-IDF or KeyBERT score
  frequency: number;
  trend: "rising" | "stable" | "falling";
}

interface TopicSignal {
  topicId: string;
  label: string;
  keywords: string[];
  paperCount: number;
  coherenceScore: number;
}

interface EntitySignal {
  entity: string;
  type: "method" | "dataset" | "metric" | "model";
  frequency: number;
  papers: string[];
}

interface TemporalBin {
  startDate: Date;
  endDate: Date;
  paperCount: number;
  avgCitations: number;
  topKeywords: string[];
}

interface TrendMetrics {
  paperCount: number;
  paperCountPrevPeriod: number;
  growthRate: number;
  momentum: number;
  authorCount: number;
  avgCitations: number;
  crossCategoryScore: number;
  trendScore: number;
}

type TrendStatus =
  | "emerging"
  | "growing"
  | "stable"
  | "declining"
  | "breakthrough";

interface ClassifiedTrend {
  id: string;
  name: string;
  description: string;
  status: TrendStatus;
  keywords: string[];
  categories: string[];
  metrics: TrendMetrics;
  timeSeries: { date: string; paperCount: number }[];
  topPapers: string[];
  relatedTrends: string[];
}

interface TrendForecast {
  trendId: string;
  direction: "up" | "down" | "stable";
  confidence: number;
  reasoning: string;
  predictedGrowthRate: number;
  timeHorizon: string;
}

interface ErrorInfo {
  node: string;
  error: string;
  timestamp: Date;
  recoverable: boolean;
}

type ProcessingStatus =
  | "idle"
  | "loading_papers"
  | "extracting_signals"
  | "computing_metrics"
  | "classifying"
  | "forecasting"
  | "saving"
  | "complete"
  | "failed";

interface Progress {
  currentNode: string;
  papersLoaded: number;
  signalsExtracted: number;
  trendsClassified: number;
  forecastsGenerated: number;
}

// LangGraph State Annotation
export const TrendAnalysisState = Annotation.Root({
  // Input parameters
  category: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "cs.AI",
  }),

  period: Annotation<"daily" | "weekly" | "monthly">({
    reducer: (_, update) => update,
    default: () => "weekly" as const,
  }),

  // Loaded papers
  papers: Annotation<Paper[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),

  previousPeriodPapers: Annotation<Paper[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),

  // Extracted signals
  signals: Annotation<TrendSignals | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Computed metrics
  metrics: Annotation<TrendMetrics | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Classified trends
  trends: Annotation<ClassifiedTrend[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),

  // Forecasts
  forecasts: Annotation<TrendForecast[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Saved trend IDs
  savedTrendIds: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Processing status
  status: Annotation<ProcessingStatus>({
    reducer: (_, update) => update,
    default: () => "idle" as ProcessingStatus,
  }),

  // Progress tracking
  progress: Annotation<Progress>({
    reducer: (_, update) => update,
    default: () => ({
      currentNode: "start",
      papersLoaded: 0,
      signalsExtracted: 0,
      trendsClassified: 0,
      forecastsGenerated: 0,
    }),
  }),

  // Error tracking
  errors: Annotation<ErrorInfo[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
});

export type TrendAnalysisStateType = typeof TrendAnalysisState.State;
```

### StateGraph Definition

```typescript
// src/agents/trend-analysis/graph.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { TrendAnalysisState, TrendAnalysisStateType } from "./state";
import { ConvexCheckpointer } from "../checkpointer/convex";

// Import nodes
import { loadPapersNode } from "./nodes/load-papers";
import { extractSignalsNode } from "./nodes/extract-signals";
import { computeMetricsNode } from "./nodes/compute-metrics";
import { classifyTrendsNode } from "./nodes/classify-trends";
import { generateForecastNode } from "./nodes/generate-forecast";
import { saveTrendsNode } from "./nodes/save-trends";

// Build the graph
const builder = new StateGraph(TrendAnalysisState)
  // Add all nodes
  .addNode("load_papers", loadPapersNode)
  .addNode("extract_signals", extractSignalsNode)
  .addNode("compute_metrics", computeMetricsNode)
  .addNode("classify_trends", classifyTrendsNode)
  .addNode("generate_forecast", generateForecastNode)
  .addNode("save_trends", saveTrendsNode)

  // Define edges (sequential flow)
  .addEdge(START, "load_papers")
  .addEdge("load_papers", "extract_signals")
  .addEdge("extract_signals", "compute_metrics")
  .addEdge("compute_metrics", "classify_trends")
  .addEdge("classify_trends", "generate_forecast")
  .addEdge("generate_forecast", "save_trends")
  .addEdge("save_trends", END);

// Compile with Convex checkpointer
export function createTrendAnalysisGraph(convexClient: ConvexClient) {
  const checkpointer = new ConvexCheckpointer(convexClient);

  return builder.compile({
    checkpointer,
  });
}

// Export compiled graph for direct use
export const trendAnalysisGraph = builder.compile();
```

### Node Implementations

#### 1. Load Papers Node

```typescript
// src/agents/trend-analysis/nodes/load-papers.ts
import { TrendAnalysisStateType } from "../state";
import { convexQuery } from "@/agents/tools/data/convex";

export async function loadPapersNode(
  state: TrendAnalysisStateType
): Promise<Partial<TrendAnalysisStateType>> {
  console.log(
    `[load_papers] Loading papers for ${state.category} (${state.period})...`
  );

  try {
    const now = new Date();
    const periodDays =
      state.period === "daily" ? 1 : state.period === "weekly" ? 7 : 30;

    // Calculate date ranges
    const currentPeriodStart = new Date(
      now.getTime() - periodDays * 24 * 60 * 60 * 1000
    );
    const previousPeriodStart = new Date(
      currentPeriodStart.getTime() - periodDays * 24 * 60 * 60 * 1000
    );

    // Fetch current period papers
    const papers = await convexQuery("papers:byCategory", {
      category: state.category,
      startDate: currentPeriodStart.toISOString(),
      endDate: now.toISOString(),
      limit: 1000,
    });

    // Fetch previous period papers for comparison
    const previousPeriodPapers = await convexQuery("papers:byCategory", {
      category: state.category,
      startDate: previousPeriodStart.toISOString(),
      endDate: currentPeriodStart.toISOString(),
      limit: 1000,
    });

    console.log(
      `[load_papers] Loaded ${papers.length} current papers, ${previousPeriodPapers.length} previous`
    );

    return {
      papers: papers.map(transformPaper),
      previousPeriodPapers: previousPeriodPapers.map(transformPaper),
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

function transformPaper(doc: any): Paper {
  return {
    id: doc._id,
    arxivId: doc.arxivId,
    title: doc.title,
    abstract: doc.abstract,
    authors: doc.authors,
    categories: doc.categories,
    publishedDate: new Date(doc.publishedDate),
    citationCount: doc.citationCount,
    embedding: doc.embedding,
  };
}
```

#### 2. Extract Signals Node

```typescript
// src/agents/trend-analysis/nodes/extract-signals.ts
import {
  TrendAnalysisStateType,
  TrendSignals,
  KeywordSignal,
  TopicSignal,
  EntitySignal,
} from "../state";
import { batchGenerateEmbeddings } from "@/agents/tools/embedding";
import { openrouter } from "@/agents/tools/llm/openrouter";
import { z } from "zod";

// TF-IDF implementation (simplified)
function computeTFIDF(documents: string[]): Map<string, number> {
  const termFreq = new Map<string, number>();
  const docFreq = new Map<string, Set<number>>();

  documents.forEach((doc, docIdx) => {
    const words = doc
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3);
    const uniqueWords = new Set(words);

    words.forEach((word) => {
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    });

    uniqueWords.forEach((word) => {
      if (!docFreq.has(word)) docFreq.set(word, new Set());
      docFreq.get(word)!.add(docIdx);
    });
  });

  const tfidf = new Map<string, number>();
  const N = documents.length;

  termFreq.forEach((tf, term) => {
    const df = docFreq.get(term)?.size || 1;
    const idf = Math.log(N / df);
    tfidf.set(term, tf * idf);
  });

  return tfidf;
}

const EntityExtractionSchema = z.object({
  methods: z.array(z.string()).describe("ML/AI methods mentioned"),
  datasets: z.array(z.string()).describe("Datasets mentioned"),
  metrics: z.array(z.string()).describe("Evaluation metrics mentioned"),
  models: z.array(z.string()).describe("Model architectures mentioned"),
});

export async function extractSignalsNode(
  state: TrendAnalysisStateType
): Promise<Partial<TrendAnalysisStateType>> {
  console.log(
    `[extract_signals] Extracting signals from ${state.papers.length} papers...`
  );

  if (state.papers.length === 0) {
    return {
      signals: { keywords: [], topics: [], entities: [], temporalBins: [] },
      status: "computing_metrics",
    };
  }

  try {
    // 1. Keyword extraction using TF-IDF
    const abstracts = state.papers.map((p) => p.abstract);
    const tfidfScores = computeTFIDF(abstracts);

    // Get top keywords
    const sortedKeywords = Array.from(tfidfScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    // Compare with previous period for trend direction
    const prevAbstracts = state.previousPeriodPapers.map((p) => p.abstract);
    const prevTfidf = computeTFIDF(prevAbstracts);

    const keywords: KeywordSignal[] = sortedKeywords.map(([keyword, score]) => {
      const prevScore = prevTfidf.get(keyword) || 0;
      const trend =
        score > prevScore * 1.2
          ? "rising"
          : score < prevScore * 0.8
            ? "falling"
            : "stable";
      return {
        keyword,
        score,
        frequency: state.papers.filter((p) =>
          p.abstract.toLowerCase().includes(keyword.toLowerCase())
        ).length,
        trend,
      };
    });

    // 2. Topic clustering using embeddings + LLM labeling
    const embeddings = await batchGenerateEmbeddings(abstracts.slice(0, 100));
    const topics = await clusterAndLabelTopics(
      state.papers.slice(0, 100),
      embeddings
    );

    // 3. Entity extraction using LLM
    const entities = await extractEntities(state.papers.slice(0, 50));

    // 4. Temporal binning
    const temporalBins = computeTemporalBins(state.papers, state.period);

    const signals: TrendSignals = {
      keywords,
      topics,
      entities,
      temporalBins,
    };

    console.log(
      `[extract_signals] Extracted ${keywords.length} keywords, ${topics.length} topics, ${entities.length} entities`
    );

    return {
      signals,
      status: "computing_metrics",
      progress: {
        ...state.progress,
        currentNode: "extract_signals",
        signalsExtracted: keywords.length + topics.length + entities.length,
      },
    };
  } catch (error) {
    console.error("[extract_signals] Signal extraction failed:", error);
    return {
      status: "failed",
      errors: [
        {
          node: "extract_signals",
          error: `Signal extraction failed: ${error}`,
          timestamp: new Date(),
          recoverable: true,
        },
      ],
    };
  }
}

async function clusterAndLabelTopics(
  papers: Paper[],
  embeddings: number[][]
): Promise<TopicSignal[]> {
  // Simple clustering using cosine similarity
  const clusters = new Map<number, number[]>();
  const assigned = new Set<number>();

  // Greedy clustering
  for (let i = 0; i < embeddings.length; i++) {
    if (assigned.has(i)) continue;

    const cluster = [i];
    assigned.add(i);

    for (let j = i + 1; j < embeddings.length; j++) {
      if (assigned.has(j)) continue;

      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
      if (similarity > 0.8) {
        cluster.push(j);
        assigned.add(j);
      }
    }

    if (cluster.length >= 3) {
      clusters.set(clusters.size, cluster);
    }
  }

  // Label clusters using LLM
  const topics: TopicSignal[] = [];

  for (const [clusterId, paperIndices] of clusters) {
    const clusterPapers = paperIndices.map((i) => papers[i]);
    const titles = clusterPapers.map((p) => p.title).slice(0, 5);

    const response = await openrouter.chat({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "user",
          content: `These research papers belong to the same topic cluster. Provide a short topic label (3-5 words) and 5 key keywords.

Paper titles:
${titles.map((t) => `- ${t}`).join("\n")}

Respond with JSON: { "label": "...", "keywords": ["...", "..."] }`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const { label, keywords } = JSON.parse(response.choices[0].message.content);

    topics.push({
      topicId: `topic-${clusterId}`,
      label,
      keywords,
      paperCount: paperIndices.length,
      coherenceScore: 0.8, // Simplified
    });
  }

  return topics;
}

async function extractEntities(papers: Paper[]): Promise<EntitySignal[]> {
  const allEntities: EntitySignal[] = [];

  // Process in batches
  for (let i = 0; i < papers.length; i += 10) {
    const batch = papers.slice(i, i + 10);
    const abstracts = batch.map((p) => p.abstract).join("\n\n---\n\n");

    const response = await openrouter.chat({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "user",
          content: `Extract ML/AI entities from these paper abstracts.

${abstracts}

Return JSON with arrays: methods, datasets, metrics, models`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const extracted = EntityExtractionSchema.parse(
      JSON.parse(response.choices[0].message.content)
    );

    // Aggregate entities
    extracted.methods.forEach((m) => {
      const existing = allEntities.find(
        (e) => e.entity === m && e.type === "method"
      );
      if (existing) existing.frequency++;
      else
        allEntities.push({
          entity: m,
          type: "method",
          frequency: 1,
          papers: [],
        });
    });

    extracted.datasets.forEach((d) => {
      const existing = allEntities.find(
        (e) => e.entity === d && e.type === "dataset"
      );
      if (existing) existing.frequency++;
      else
        allEntities.push({
          entity: d,
          type: "dataset",
          frequency: 1,
          papers: [],
        });
    });

    extracted.metrics.forEach((m) => {
      const existing = allEntities.find(
        (e) => e.entity === m && e.type === "metric"
      );
      if (existing) existing.frequency++;
      else
        allEntities.push({
          entity: m,
          type: "metric",
          frequency: 1,
          papers: [],
        });
    });

    extracted.models.forEach((m) => {
      const existing = allEntities.find(
        (e) => e.entity === m && e.type === "model"
      );
      if (existing) existing.frequency++;
      else
        allEntities.push({
          entity: m,
          type: "model",
          frequency: 1,
          papers: [],
        });
    });
  }

  return allEntities.sort((a, b) => b.frequency - a.frequency).slice(0, 50);
}

function computeTemporalBins(papers: Paper[], period: string): TemporalBin[] {
  const binSize = period === "daily" ? 1 : period === "weekly" ? 1 : 7; // days per bin
  const bins = new Map<string, Paper[]>();

  papers.forEach((paper) => {
    const date = new Date(paper.publishedDate);
    const binKey = `${date.getFullYear()}-${date.getMonth()}-${Math.floor(date.getDate() / binSize)}`;

    if (!bins.has(binKey)) bins.set(binKey, []);
    bins.get(binKey)!.push(paper);
  });

  return Array.from(bins.entries()).map(([key, binPapers]) => ({
    startDate: binPapers[0].publishedDate,
    endDate: binPapers[binPapers.length - 1].publishedDate,
    paperCount: binPapers.length,
    avgCitations:
      binPapers.reduce((sum, p) => sum + (p.citationCount || 0), 0) /
      binPapers.length,
    topKeywords: [], // Would be computed from TF-IDF per bin
  }));
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

#### 3. Compute Metrics Node

```typescript
// src/agents/trend-analysis/nodes/compute-metrics.ts
import { TrendAnalysisStateType, TrendMetrics } from "../state";

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

  // Momentum: second derivative of paper count (simplified)
  // Would need more historical data for accurate computation
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

  // Author participation
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
  const categoryCount = new Set(currentPapers.flatMap((p) => p.categories))
    .size;
  const crossCategoryScore = Math.min(categoryCount / 5, 1); // Normalized

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
```

#### 4. Classify Trends Node

```typescript
// src/agents/trend-analysis/nodes/classify-trends.ts
import { TrendAnalysisStateType, ClassifiedTrend, TrendStatus } from "../state";
import { v4 as uuidv4 } from "uuid";

export async function classifyTrendsNode(
  state: TrendAnalysisStateType
): Promise<Partial<TrendAnalysisStateType>> {
  console.log("[classify_trends] Classifying trends...");

  if (!state.signals || !state.metrics) {
    return {
      trends: [],
      status: "forecasting",
    };
  }

  const trends: ClassifiedTrend[] = [];

  // Create trend for each significant topic
  for (const topic of state.signals.topics) {
    if (topic.paperCount < 3) continue;

    // Filter papers belonging to this topic (by keyword match)
    const topicPapers = state.papers.filter((p) =>
      topic.keywords.some(
        (kw) =>
          p.title.toLowerCase().includes(kw.toLowerCase()) ||
          p.abstract.toLowerCase().includes(kw.toLowerCase())
      )
    );

    // Compute topic-specific metrics
    const prevTopicPapers = state.previousPeriodPapers.filter((p) =>
      topic.keywords.some(
        (kw) =>
          p.title.toLowerCase().includes(kw.toLowerCase()) ||
          p.abstract.toLowerCase().includes(kw.toLowerCase())
      )
    );

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

    trends.push({
      id: uuidv4(),
      name: topic.label,
      description: `Research trend in ${topic.label} with ${topicPapers.length} papers`,
      status,
      keywords: topic.keywords,
      categories: [...new Set(topicPapers.flatMap((p) => p.categories))],
      metrics: {
        ...state.metrics,
        paperCount: topicPapers.length,
        paperCountPrevPeriod: prevTopicPapers.length,
        growthRate: topicGrowthRate,
      },
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

function buildTimeSeries(
  papers: Paper[],
  period: string
): { date: string; paperCount: number }[] {
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
```

#### 5. Generate Forecast Node

```typescript
// src/agents/trend-analysis/nodes/generate-forecast.ts
import { TrendAnalysisStateType, TrendForecast } from "../state";
import { openrouter } from "@/agents/tools/llm/openrouter";
import { z } from "zod";

const ForecastSchema = z.object({
  direction: z.enum(["up", "down", "stable"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  predictedGrowthRate: z.number(),
});

export async function generateForecastNode(
  state: TrendAnalysisStateType
): Promise<Partial<TrendAnalysisStateType>> {
  console.log(
    `[generate_forecast] Generating forecasts for ${state.trends.length} trends...`
  );

  const forecasts: TrendForecast[] = [];

  for (const trend of state.trends) {
    try {
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
${trend.timeSeries
  .slice(-10)
  .map((t) => `${t.date}: ${t.paperCount} papers`)
  .join("\n")}

Predict the trend direction for the next period:
- direction: "up", "down", or "stable"
- confidence: 0-1 (how confident in the prediction)
- reasoning: Brief explanation
- predictedGrowthRate: Expected growth rate as decimal

Return as JSON.`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const forecast = ForecastSchema.parse(
        JSON.parse(response.choices[0].message.content)
      );

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
        reasoning: "Based on historical growth rate",
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
```

#### 6. Save Trends Node

```typescript
// src/agents/trend-analysis/nodes/save-trends.ts
import { TrendAnalysisStateType } from "../state";
import { convexMutation } from "@/agents/tools/data/convex";

export async function saveTrendsNode(
  state: TrendAnalysisStateType
): Promise<Partial<TrendAnalysisStateType>> {
  console.log(`[save_trends] Saving ${state.trends.length} trends...`);

  const savedTrendIds: string[] = [];

  for (const trend of state.trends) {
    try {
      // Find matching forecast
      const forecast = state.forecasts.find((f) => f.trendId === trend.id);

      const trendId = await convexMutation("trends:upsert", {
        trendId: trend.id,
        name: trend.name,
        description: trend.description,
        status: trend.status,
        categories: trend.categories,
        keywords: trend.keywords,
        metrics: {
          paperCount: trend.metrics.paperCount,
          paperCountPrevPeriod: trend.metrics.paperCountPrevPeriod,
          growthRate: trend.metrics.growthRate,
          authorCount: trend.metrics.authorCount,
          avgCitations: trend.metrics.avgCitations,
          trendScore: trend.metrics.trendScore,
        },
        timeSeries: trend.timeSeries,
        topPapers: trend.topPapers,
        relatedTrends: trend.relatedTrends,
        forecast: forecast
          ? {
              direction: forecast.direction,
              confidence: forecast.confidence,
            }
          : undefined,
        computedAt: Date.now(),
      });

      savedTrendIds.push(trendId);
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
```

---

## API Routes for Agent Control

```typescript
// src/app/api/agents/trend-analysis/trigger/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createTrendAnalysisGraph } from "@/agents/trend-analysis/graph";
import { ConvexHttpClient } from "convex/browser";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, period } = await req.json();

  const convexClient = new ConvexHttpClient(
    process.env.NEXT_PUBLIC_CONVEX_URL!
  );
  const graph = createTrendAnalysisGraph(convexClient);

  const threadId = uuidv4();

  // Create task record
  await convexClient.mutation("agentTasks:create", {
    taskId: threadId,
    agentType: "trend_analysis",
    status: "running",
    priority: "medium",
    payload: { category, period },
    createdAt: Date.now(),
  });

  // Run graph with streaming
  const stream = graph.stream(
    { category: category || "cs.AI", period: period || "weekly" },
    { configurable: { thread_id: threadId } }
  );

  // Process stream in background
  (async () => {
    try {
      let finalState;
      for await (const chunk of stream) {
        finalState = chunk;
        // Could emit progress events here via WebSocket/SSE
      }

      await convexClient.mutation("agentTasks:update", {
        taskId: threadId,
        status: "completed",
        result: {
          trendsFound: finalState?.trends?.length || 0,
          forecastsGenerated: finalState?.forecasts?.length || 0,
        },
        completedAt: Date.now(),
      });
    } catch (error: any) {
      await convexClient.mutation("agentTasks:update", {
        taskId: threadId,
        status: "failed",
        error: error.message,
        completedAt: Date.now(),
      });
    }
  })();

  return NextResponse.json({
    taskId: threadId,
    message: "Trend analysis agent started",
  });
}
```

---

## Convex Functions (Data Persistence Only)

```typescript
// convex/trends.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const upsert = mutation({
  args: {
    trendId: v.string(),
    name: v.string(),
    description: v.string(),
    status: v.string(),
    categories: v.array(v.string()),
    keywords: v.array(v.string()),
    metrics: v.object({
      paperCount: v.number(),
      paperCountPrevPeriod: v.number(),
      growthRate: v.number(),
      authorCount: v.number(),
      avgCitations: v.number(),
      trendScore: v.number(),
    }),
    timeSeries: v.array(
      v.object({
        date: v.string(),
        paperCount: v.number(),
      })
    ),
    topPapers: v.array(v.string()),
    relatedTrends: v.array(v.string()),
    forecast: v.optional(
      v.object({
        direction: v.string(),
        confidence: v.number(),
      })
    ),
    computedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if trend exists
    const existing = await ctx.db
      .query("trends")
      .withIndex("by_trend_id", (q) => q.eq("trendId", args.trendId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("trends", args);
  },
});

export const list = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("trends");

    if (args.status) {
      q = q.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await q.order("desc").take(args.limit || 50);
  },
});

export const emerging = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("trends")
      .withIndex("by_status", (q) => q.eq("status", "emerging"))
      .order("desc")
      .take(20);
  },
});

export const breakthrough = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("trends")
      .withIndex("by_status", (q) => q.eq("status", "breakthrough"))
      .order("desc")
      .take(10);
  },
});

// convex/analytics.ts
export const getDashboardMetrics = query({
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Papers processed
    const papersToday = await ctx.db
      .query("papers")
      .filter((q) => q.gte(q.field("processedAt"), oneDayAgo))
      .collect();

    const papersThisWeek = await ctx.db
      .query("papers")
      .filter((q) => q.gte(q.field("processedAt"), oneWeekAgo))
      .collect();

    // Trends
    const emergingTrends = await ctx.db
      .query("trends")
      .withIndex("by_status", (q) => q.eq("status", "emerging"))
      .collect();

    const breakthroughs = await ctx.db
      .query("trends")
      .withIndex("by_status", (q) => q.eq("status", "breakthrough"))
      .filter((q) => q.gte(q.field("computedAt"), oneWeekAgo))
      .collect();

    return {
      papersProcessedToday: papersToday.length,
      papersProcessedThisWeek: papersThisWeek.length,
      emergingTrendsCount: emergingTrends.length,
      breakthroughsThisWeek: breakthroughs.length,
    };
  },
});
```

---

## Shared Tools Integration (from Plan 7)

This agent uses the following shared tools from `src/agents/tools/`:

| Tool Category | Tools Used                                      |
| ------------- | ----------------------------------------------- |
| **Data**      | `convexQuery`, `convexMutation`                 |
| **LLM**       | `openrouter.chat` (topic labeling, forecasting) |
| **Embedding** | `batchGenerateEmbeddings` (topic clustering)    |

See Plan 7 for full tool implementations.

---

## Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] Define LangGraph state schema with Annotations
- [ ] Implement StateGraph with all nodes
- [ ] Set up ConvexCheckpointer for state persistence
- [ ] Create API routes for agent control

### Phase 2: Signal Extraction

- [ ] Implement TF-IDF keyword extraction
- [ ] Integrate embedding-based topic clustering
- [ ] Implement LLM-based topic labeling
- [ ] Create entity extraction pipeline
- [ ] Build temporal binning

### Phase 3: Metrics & Classification

- [ ] Implement growth rate calculation
- [ ] Create momentum computation
- [ ] Build cross-category analysis
- [ ] Implement trend classification
- [ ] Build trend score computation

### Phase 4: Forecasting

- [ ] Implement LLM-based trend forecasting
- [ ] Add confidence scoring
- [ ] Create fallback heuristics

### Phase 5: Persistence & Visualization

- [ ] Implement save_trends node
- [ ] Create Convex queries for trends
- [ ] Build analytics dashboard queries
- [ ] Create trend visualization components

---

## Verification Criteria

- [ ] LangGraph StateGraph compiles without errors
- [ ] Signal extraction produces meaningful keywords
- [ ] Topic clustering creates coherent clusters
- [ ] Trend metrics compute correctly
- [ ] Classification aligns with manual review
- [ ] Forecasts have >70% directional accuracy
- [ ] ConvexCheckpointer persists state across runs
- [ ] Trend computation completes in <30 minutes
- [ ] All shared tools from Plan 7 integrate correctly
