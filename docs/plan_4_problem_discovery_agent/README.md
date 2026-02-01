# Plan 4: Startup Problem Discovery Agent (Agent 2)

**Timeline:** Weeks 13-18 (parallel)
**Dependencies:** plan_1 (Foundation & Scaffolding), plan_7 (Agent Tools)
**Parallel With:** plan_2, plan_3, plan_5, plan_6

---

## Overview

The Startup Problem Discovery Agent continuously monitors social channels, forums, and startup databases to identify pain points, challenges, and unmet needs faced by Series A+ startups.

**Architecture:** LangGraph StateGraph with supervisor orchestration

---

## Scope

- Exa.ai unified search integration (primary)
- Tavily/Perplexity (backup)
- Crunchbase startup data tracking (RapidAPI)
- **YouTube transcript analysis** (founder interviews, pitch talks, podcasts)
- Pain point extraction pipeline (LLM via OpenRouter)
- Problem clustering (HDBSCAN)
- Implicit signal detection
- Founder network intelligence

---

## Technology Stack

| Technology                 | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| **LangGraph**              | Agent orchestration and state management     |
| **OpenRouter**             | Unified LLM provider (Claude 3.5 Sonnet)     |
| **Convex**                 | Data persistence and real-time subscriptions |
| **Exa.ai**                 | Semantic web search (primary)                |
| **Tavily**                 | Research-focused search (backup)             |
| **Crunchbase (RapidAPI)**  | Series A+ startup data and funding info      |
| **YouTube Transcript API** | Founder interview and pitch talk analysis    |
| **HDBSCAN**                | Problem clustering algorithm                 |

---

## Key Deliverables

1. LangGraph StateGraph definition (SPD-001)
2. Social channel scanner node - Exa.ai (SPD-002)
3. Startup database sync node (SPD-003)
4. Pain point extraction node (SPD-004)
5. Problem clustering node (SPD-005)
6. Implicit signal detection node (SPD-006)
7. Database persistence node (SPD-007)
8. Convex persistence functions
9. Shared tools integration from Plan 7

---

## LangGraph Architecture

### Agent Orchestration Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│           PROBLEM DISCOVERY AGENT (LangGraph StateGraph)         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ORCHESTRATOR STATE                       │ │
│  │  • searchQueries: SearchQuery[]                             │ │
│  │  • rawResults: SearchResult[]                               │ │
│  │  • extractedProblems: Problem[]                             │ │
│  │  • clusteredProblems: ProblemCluster[]                      │ │
│  │  • implicitSignals: ImplicitSignal[]                        │ │
│  │  • savedProblems: SavedProblem[]                            │ │
│  │  • errors: ErrorInfo[]                                      │ │
│  │  • status: ProcessingStatus                                 │ │
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
│  │  │ search_channels │ ──► Exa.ai semantic search           │   │
│  │  └────────┬────────┘     across all platforms             │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │ sync_startups   │ ──► Crunchbase Series A+ data        │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │ extract_problems│ ──► LLM-based pain point extraction  │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │ detect_implicit │ ──► Implicit signal detection        │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │ cluster_problems│ ──► HDBSCAN clustering               │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │ save_to_db      │ ──► Convex persistence               │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │         END                                               │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Checkpointing: ConvexCheckpointer (thread-based persistence)   │
│  Triggering: API routes, webhooks, or manual invocation         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## LangGraph Implementation

### State Schema Definition

```typescript
// src/agents/problem-discovery/state.ts
import { Annotation } from "@langchain/langgraph";

// Type definitions
interface SearchQuery {
  id: string;
  query: string;
  type: "explicit" | "implicit" | "review" | "hiring" | "founder";
  domains?: string[];
  dateRange?: { start: Date; end: Date };
}

interface SearchResult {
  id: string;
  queryId: string;
  url: string;
  title: string;
  text: string;
  highlights?: string[];
  publishedDate?: Date;
  domain: string;
  platform: "reddit" | "twitter" | "hackernews" | "github" | "g2" | "other";
  score: number;
}

interface Problem {
  id: string;
  sourceResultId: string;
  statement: string;
  category: {
    primary: "technical" | "operational" | "product" | "business";
    secondary: string;
    tertiary?: string;
  };
  severity: number; // 1-10
  frequency: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high" | "critical";
  addressability: number; // 0-1 confidence
  evidence: string[];
  startupId?: string;
}

interface ImplicitSignal {
  id: string;
  sourceResultId: string;
  signalType:
    | "build_vs_buy"
    | "excessive_hiring"
    | "workaround_sharing"
    | "migration_announcement"
    | "open_source_creation"
    | "integration_complaint"
    | "scale_breakpoint"
    | "manual_process";
  inferredProblem: string;
  confidence: number;
  evidence: string;
}

interface ProblemCluster {
  id: string;
  theme: string;
  description: string;
  problemIds: string[];
  size: number;
  industries: string[];
  fundingStages: string[];
  growthRate: number; // new problems/week
}

interface SavedProblem {
  convexId: string;
  problemId: string;
  savedAt: Date;
}

interface ErrorInfo {
  node: string;
  error: string;
  timestamp: Date;
  recoverable: boolean;
}

type ProcessingStatus =
  | "idle"
  | "searching"
  | "syncing_startups"
  | "extracting"
  | "detecting_signals"
  | "clustering"
  | "saving"
  | "complete"
  | "failed";

interface Progress {
  currentNode: string;
  queriesProcessed: number;
  totalQueries: number;
  resultsFound: number;
  problemsExtracted: number;
  signalsDetected: number;
  clustersFormed: number;
}

// LangGraph State Annotation
export const ProblemDiscoveryState = Annotation.Root({
  // Input
  searchQueries: Annotation<SearchQuery[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Search results
  rawResults: Annotation<SearchResult[]>({
    reducer: (current, update) => {
      const existingIds = new Set(current.map((r) => r.id));
      const newResults = update.filter((r) => !existingIds.has(r.id));
      return [...current, ...newResults];
    },
    default: () => [],
  }),

  // Extracted problems
  extractedProblems: Annotation<Problem[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Implicit signals
  implicitSignals: Annotation<ImplicitSignal[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Clustered problems
  clusteredProblems: Annotation<ProblemCluster[]>({
    reducer: (_, update) => update, // Replace on update
    default: () => [],
  }),

  // Saved references
  savedProblems: Annotation<SavedProblem[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Error tracking
  errors: Annotation<ErrorInfo[]>({
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
      queriesProcessed: 0,
      totalQueries: 0,
      resultsFound: 0,
      problemsExtracted: 0,
      signalsDetected: 0,
      clustersFormed: 0,
    }),
  }),
});

export type ProblemDiscoveryStateType = typeof ProblemDiscoveryState.State;
```

### StateGraph Definition

```typescript
// src/agents/problem-discovery/graph.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { ProblemDiscoveryState, ProblemDiscoveryStateType } from "./state";
import { ConvexCheckpointer } from "../checkpointer/convex";

// Import nodes
import { searchChannelsNode } from "./nodes/search-channels";
import { syncStartupsNode } from "./nodes/sync-startups";
import { extractProblemsNode } from "./nodes/extract-problems";
import { detectImplicitNode } from "./nodes/detect-implicit";
import { clusterProblemsNode } from "./nodes/cluster-problems";
import { saveToDbNode } from "./nodes/save-to-db";

// Build the graph
const builder = new StateGraph(ProblemDiscoveryState)
  // Add all nodes
  .addNode("search_channels", searchChannelsNode)
  .addNode("sync_startups", syncStartupsNode)
  .addNode("extract_problems", extractProblemsNode)
  .addNode("detect_implicit", detectImplicitNode)
  .addNode("cluster_problems", clusterProblemsNode)
  .addNode("save_to_db", saveToDbNode)

  // Define edges (sequential flow)
  .addEdge(START, "search_channels")
  .addEdge("search_channels", "sync_startups")
  .addEdge("sync_startups", "extract_problems")
  .addEdge("extract_problems", "detect_implicit")
  .addEdge("detect_implicit", "cluster_problems")
  .addEdge("cluster_problems", "save_to_db")
  .addEdge("save_to_db", END);

// Compile with Convex checkpointer
export function createProblemDiscoveryGraph(convexClient: ConvexClient) {
  const checkpointer = new ConvexCheckpointer(convexClient);

  return builder.compile({
    checkpointer,
  });
}

// Export compiled graph for direct use
export const problemDiscoveryGraph = builder.compile();
```

### Node Implementations

#### 1. Search Channels Node (Exa.ai Integration)

```typescript
// src/agents/problem-discovery/nodes/search-channels.ts
import { ProblemDiscoveryStateType } from "../state";
import { exaSearch, exaSimilaritySearch } from "@/agents/tools/search/exa";
import { tavilySearch } from "@/agents/tools/search/tavily";
import { v4 as uuidv4 } from "uuid";

// Pre-defined search query templates
const QUERY_TEMPLATES = {
  explicit: [
    "startup founder struggling with scaling infrastructure",
    "our team spends too much time on manual data pipeline work",
    "biggest challenge as a Series A startup",
    "pain point running engineering team at scale",
    "wish there was a better solution for developer productivity",
  ],
  implicit: [
    "we built our own internal tool because nothing existed",
    "had to write custom solution for data quality monitoring",
    "here's how we hack around the limitations of",
    "switched from X to Y because critical limitations",
  ],
  reviews: [
    "disappointed with limitations missing features enterprise software",
    "frustrated with pricing complexity SaaS tools",
  ],
  hiring: [
    "hiring to fix rebuild scale our broken infrastructure",
    "looking for someone who has solved data pipeline problems",
  ],
  founder: [
    "as a founder CEO our biggest challenge problem scaling",
    "startup lessons learned hardest part building company",
  ],
};

const PLATFORM_DOMAINS: Record<string, string[]> = {
  social: ["reddit.com", "twitter.com", "news.ycombinator.com"],
  reviews: ["g2.com", "capterra.com", "trustradius.com"],
  hiring: ["linkedin.com", "lever.co", "greenhouse.io"],
  tech: ["github.com", "stackoverflow.com"],
};

export async function searchChannelsNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  console.log("[search_channels] Starting social channel search...");

  const results: SearchResult[] = [];
  const errors: ErrorInfo[] = [];
  const queries: SearchQuery[] = [];

  // Generate search queries from templates
  for (const [type, templates] of Object.entries(QUERY_TEMPLATES)) {
    for (const query of templates) {
      queries.push({
        id: uuidv4(),
        query,
        type: type as SearchQuery["type"],
        domains:
          type === "reviews"
            ? PLATFORM_DOMAINS.reviews
            : PLATFORM_DOMAINS.social,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          end: new Date(),
        },
      });
    }
  }

  // Execute searches with Exa.ai (primary)
  for (const searchQuery of queries) {
    try {
      const exaResults = await exaSearch({
        query: searchQuery.query,
        type: "neural",
        numResults: 50,
        includeDomains: searchQuery.domains,
        startPublishedDate: searchQuery.dateRange?.start.toISOString(),
        contents: { text: true, highlights: true },
      });

      // Transform Exa results to our format
      for (const result of exaResults.results) {
        results.push({
          id: uuidv4(),
          queryId: searchQuery.id,
          url: result.url,
          title: result.title,
          text: result.text || "",
          highlights: result.highlights,
          publishedDate: result.publishedDate
            ? new Date(result.publishedDate)
            : undefined,
          domain: new URL(result.url).hostname,
          platform: detectPlatform(result.url),
          score: result.score || 0.5,
        });
      }

      console.log(
        `[search_channels] Query "${searchQuery.query.slice(0, 40)}..." returned ${exaResults.results.length} results`
      );
    } catch (error) {
      console.error(
        `[search_channels] Exa search failed, trying Tavily fallback:`,
        error
      );

      // Fallback to Tavily
      try {
        const tavilyResults = await tavilySearch({
          query: searchQuery.query,
          maxResults: 20,
          searchDepth: "advanced",
          includeDomains: searchQuery.domains,
        });

        for (const result of tavilyResults.results) {
          results.push({
            id: uuidv4(),
            queryId: searchQuery.id,
            url: result.url,
            title: result.title,
            text: result.content,
            domain: new URL(result.url).hostname,
            platform: detectPlatform(result.url),
            score: result.score,
          });
        }
      } catch (tavilyError) {
        errors.push({
          node: "search_channels",
          error: `Both Exa and Tavily failed for query: ${searchQuery.query}`,
          timestamp: new Date(),
          recoverable: true,
        });
      }
    }
  }

  // Deduplicate by URL
  const uniqueResults = deduplicateResults(results);

  console.log(
    `[search_channels] Total unique results: ${uniqueResults.length}`
  );

  return {
    searchQueries: queries,
    rawResults: uniqueResults,
    status: "syncing_startups",
    progress: {
      currentNode: "search_channels",
      queriesProcessed: queries.length,
      totalQueries: queries.length,
      resultsFound: uniqueResults.length,
      problemsExtracted: 0,
      signalsDetected: 0,
      clustersFormed: 0,
    },
    errors,
  };
}

function detectPlatform(url: string): SearchResult["platform"] {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes("reddit.com")) return "reddit";
  if (hostname.includes("twitter.com") || hostname.includes("x.com"))
    return "twitter";
  if (hostname.includes("ycombinator.com")) return "hackernews";
  if (hostname.includes("github.com")) return "github";
  if (hostname.includes("g2.com")) return "g2";
  return "other";
}

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  for (const result of results) {
    const normalizedUrl = result.url.toLowerCase().replace(/\/$/, "");
    if (
      !seen.has(normalizedUrl) ||
      result.score > seen.get(normalizedUrl)!.score
    ) {
      seen.set(normalizedUrl, result);
    }
  }
  return Array.from(seen.values());
}
```

#### 2. Sync Startups Node (Crunchbase Integration)

```typescript
// src/agents/problem-discovery/nodes/sync-startups.ts
import { ProblemDiscoveryStateType } from "../state";
import {
  crunchbaseSearch,
  crunchbaseGetDetails,
} from "@/agents/tools/search/crunchbase";
import { convexMutation, convexQuery } from "@/agents/tools/data/convex";

interface StartupFilter {
  fundingStage: ("series_a" | "series_b" | "series_c" | "series_d_plus")[];
  fundingAmountMin: number;
  foundedAfter: Date;
  industries: string[];
  employeeCountMin: number;
  employeeCountMax: number;
}

const DEFAULT_FILTER: StartupFilter = {
  fundingStage: ["series_a", "series_b", "series_c"],
  fundingAmountMin: 5_000_000, // $5M minimum
  foundedAfter: new Date("2019-01-01"),
  industries: [
    "AI/ML",
    "SaaS",
    "FinTech",
    "HealthTech",
    "DevTools",
    "Data Infrastructure",
  ],
  employeeCountMin: 20,
  employeeCountMax: 500,
};

export async function syncStartupsNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  console.log("[sync_startups] Syncing startup data from Crunchbase...");

  const errors: ErrorInfo[] = [];

  try {
    // Get existing startups from Convex
    const existingStartups = await convexQuery("startups:list", {
      limit: 1000,
    });

    const existingIds = new Set(
      existingStartups.map((s: any) => s.crunchbaseId)
    );

    // Search for new Series A+ startups
    const searchResults = await crunchbaseSearch({
      fundingRoundTypes: DEFAULT_FILTER.fundingStage,
      fundingTotalMin: DEFAULT_FILTER.fundingAmountMin,
      foundedOnAfter: DEFAULT_FILTER.foundedAfter.toISOString().split("T")[0],
      categories: DEFAULT_FILTER.industries,
      numEmployeesMin: DEFAULT_FILTER.employeeCountMin,
      numEmployeesMax: DEFAULT_FILTER.employeeCountMax,
      limit: 100,
    });

    // Process new startups
    let newStartupsCount = 0;
    for (const startup of searchResults.entities) {
      if (existingIds.has(startup.uuid)) continue;

      // Get detailed info
      const details = await crunchbaseGetDetails(startup.uuid);

      // Save to Convex
      await convexMutation("startups:create", {
        crunchbaseId: startup.uuid,
        name: startup.properties.name,
        description: startup.properties.short_description,
        website: startup.properties.homepage_url,
        industry: startup.properties.categories?.[0] || "Unknown",
        fundingStage: mapFundingStage(details.funding_rounds),
        totalFunding: details.funding_total?.value_usd || 0,
        employeeCount: details.num_employees_enum || "unknown",
        foundedDate: startup.properties.founded_on,
        location: formatLocation(details.location_identifiers),
        linkedinUrl: details.linkedin?.value,
        twitterUrl: details.twitter?.value,
        founders: extractFounders(details.founders),
        investors: extractInvestors(details.investors),
        lastSyncedAt: Date.now(),
      });

      newStartupsCount++;
    }

    console.log(`[sync_startups] Synced ${newStartupsCount} new startups`);
  } catch (error) {
    console.error("[sync_startups] Error syncing startups:", error);
    errors.push({
      node: "sync_startups",
      error: `Failed to sync startups: ${error}`,
      timestamp: new Date(),
      recoverable: true,
    });
  }

  return {
    status: "extracting",
    progress: {
      ...state.progress,
      currentNode: "sync_startups",
    },
    errors: errors.length > 0 ? errors : undefined,
  };
}

function mapFundingStage(fundingRounds: any[]): string {
  if (!fundingRounds?.length) return "unknown";
  const lastRound = fundingRounds[fundingRounds.length - 1];
  return lastRound.investment_type || "unknown";
}

function formatLocation(locations: any[]): string {
  if (!locations?.length) return "Unknown";
  const loc = locations[0];
  return [loc.city, loc.region, loc.country].filter(Boolean).join(", ");
}

function extractFounders(founders: any[]): any[] {
  if (!founders) return [];
  return founders.map((f) => ({
    name: f.properties?.full_name,
    title: f.properties?.title,
    linkedinUrl: f.properties?.linkedin?.value,
    twitterUrl: f.properties?.twitter?.value,
  }));
}

function extractInvestors(investors: any[]): string[] {
  if (!investors) return [];
  return investors.map((i) => i.properties?.name).filter(Boolean);
}
```

#### 3. Extract Problems Node (LLM-Powered)

```typescript
// src/agents/problem-discovery/nodes/extract-problems.ts
import { ProblemDiscoveryStateType, Problem } from "../state";
import { openrouter } from "@/agents/tools/llm/openrouter";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Structured output schema for problem extraction
const ProblemExtractionSchema = z.object({
  problems: z.array(
    z.object({
      statement: z.string().describe("Clear, concise problem statement"),
      category: z.object({
        primary: z.enum(["technical", "operational", "product", "business"]),
        secondary: z.string().describe("More specific subcategory"),
        tertiary: z.string().optional().describe("Most specific level"),
      }),
      severity: z
        .number()
        .min(1)
        .max(10)
        .describe("How severe is this problem (1-10)"),
      frequency: z
        .enum(["low", "medium", "high"])
        .describe("How often is this mentioned"),
      urgency: z
        .enum(["low", "medium", "high", "critical"])
        .describe("How urgent is the need"),
      addressability: z
        .number()
        .min(0)
        .max(1)
        .describe("Can research address this? (0-1 confidence)"),
      evidence: z
        .array(z.string())
        .describe("Direct quotes or paraphrased evidence"),
    })
  ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Overall extraction confidence"),
});

const EXTRACTION_PROMPT = `You are an expert at identifying startup pain points and challenges from social media content.

Analyze the following content and extract any pain points, challenges, or unmet needs that startups might be facing.

For each problem identified:
1. Write a clear, actionable problem statement
2. Categorize it (technical/operational/product/business + subcategory)
3. Score severity (1-10 based on impact)
4. Assess frequency (how often this type of problem is mentioned)
5. Determine urgency (based on language and context)
6. Estimate addressability (can academic research help solve this?)
7. Extract direct evidence (quotes or key phrases)

Focus on:
- Infrastructure and scaling challenges
- Developer productivity issues
- Data quality and pipeline problems
- Team coordination and process issues
- Tooling gaps and limitations
- Integration difficulties

IMPORTANT: Only extract genuine pain points. Ignore promotional content, general discussions, or content without clear problems.

Content to analyze:
{content}

Source: {source}
Platform: {platform}`;

export async function extractProblemsNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  console.log(
    `[extract_problems] Processing ${state.rawResults.length} results...`
  );

  const extractedProblems: Problem[] = [];
  const errors: ErrorInfo[] = [];

  // Process in batches of 10 for efficiency
  const BATCH_SIZE = 10;
  const batches = chunkArray(state.rawResults, BATCH_SIZE);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `[extract_problems] Processing batch ${i + 1}/${batches.length}`
    );

    // Process batch items in parallel
    const batchPromises = batch.map(async (result) => {
      try {
        const content = result.highlights?.join("\n\n") || result.text;
        if (!content || content.length < 50) return []; // Skip too-short content

        const response = await openrouter.chat({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            {
              role: "user",
              content: EXTRACTION_PROMPT.replace(
                "{content}",
                content.slice(0, 4000)
              )
                .replace("{source}", result.url)
                .replace("{platform}", result.platform),
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        });

        const parsed = ProblemExtractionSchema.parse(
          JSON.parse(response.choices[0].message.content)
        );

        // Only keep high-confidence extractions
        if (parsed.confidence < 0.6) return [];

        return parsed.problems.map((p) => ({
          id: uuidv4(),
          sourceResultId: result.id,
          statement: p.statement,
          category: p.category,
          severity: p.severity,
          frequency: p.frequency,
          urgency: p.urgency,
          addressability: p.addressability,
          evidence: p.evidence,
        }));
      } catch (error) {
        console.error(
          `[extract_problems] Failed to extract from ${result.url}:`,
          error
        );
        return [];
      }
    });

    const batchResults = await Promise.all(batchPromises);
    extractedProblems.push(...batchResults.flat());

    // Rate limiting between batches
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(
    `[extract_problems] Extracted ${extractedProblems.length} problems`
  );

  return {
    extractedProblems,
    status: "detecting_signals",
    progress: {
      ...state.progress,
      currentNode: "extract_problems",
      problemsExtracted: extractedProblems.length,
    },
    errors: errors.length > 0 ? errors : undefined,
  };
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

#### 4. Detect Implicit Signals Node

```typescript
// src/agents/problem-discovery/nodes/detect-implicit.ts
import { ProblemDiscoveryStateType, ImplicitSignal } from "../state";
import { openrouter } from "@/agents/tools/llm/openrouter";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const SIGNAL_PATTERNS = {
  build_vs_buy: [
    /we built our own/i,
    /had to write custom/i,
    /nothing existed for/i,
    /internal tool/i,
  ],
  excessive_hiring: [
    /hiring .* same role/i,
    /5\+ job posts/i,
    /can't keep .* position filled/i,
  ],
  workaround_sharing: [
    /here's how we hack/i,
    /workaround for/i,
    /found a way around/i,
  ],
  migration_announcement: [
    /switched from .* to/i,
    /migrated away from/i,
    /replaced .* with/i,
  ],
  open_source_creation: [
    /open sourced our/i,
    /released .* as open source/i,
    /published our internal/i,
  ],
  integration_complaint: [
    /getting .* to work together/i,
    /integration nightmare/i,
    /doesn't play well with/i,
  ],
  scale_breakpoint: [
    /worked until we hit/i,
    /broke at scale/i,
    /fell apart when we grew/i,
  ],
  manual_process: [
    /manually do/i,
    /by hand every/i,
    /human in the loop/i,
    /tedious process/i,
  ],
};

const ImplicitSignalSchema = z.object({
  signalType: z.enum([
    "build_vs_buy",
    "excessive_hiring",
    "workaround_sharing",
    "migration_announcement",
    "open_source_creation",
    "integration_complaint",
    "scale_breakpoint",
    "manual_process",
  ]),
  inferredProblem: z
    .string()
    .describe("The underlying problem implied by this signal"),
  confidence: z.number().min(0).max(1).describe("Confidence in the inference"),
  evidence: z.string().describe("The specific text that indicates this signal"),
});

const INFERENCE_PROMPT = `Analyze this content for implicit signals of startup problems.

Implicit signals are behaviors or statements that IMPLY a problem without stating it directly:
- "We built our own X" → No good solution exists for X
- "Switched from X to Y" → X has critical limitations
- "Our team manually does X" → Automation opportunity exists
- "Here's our workaround for X" → Tool X has fundamental issues

Content:
{content}

If you detect an implicit signal, identify:
1. The signal type
2. The underlying problem being implied
3. Your confidence (0-1)
4. The specific evidence

Return null if no implicit signal is detected.`;

export async function detectImplicitNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  console.log(
    `[detect_implicit] Scanning ${state.rawResults.length} results for implicit signals...`
  );

  const implicitSignals: ImplicitSignal[] = [];

  // First pass: pattern matching for quick detection
  for (const result of state.rawResults) {
    const content = result.text;

    for (const [signalType, patterns] of Object.entries(SIGNAL_PATTERNS)) {
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          // Found a potential signal, use LLM to analyze
          try {
            const response = await openrouter.chat({
              model: "anthropic/claude-3.5-sonnet",
              messages: [
                {
                  role: "user",
                  content: INFERENCE_PROMPT.replace(
                    "{content}",
                    content.slice(0, 2000)
                  ),
                },
              ],
              response_format: { type: "json_object" },
              temperature: 0.1,
            });

            const parsed = JSON.parse(response.choices[0].message.content);

            if (parsed && parsed.signalType) {
              const validated = ImplicitSignalSchema.parse(parsed);

              if (validated.confidence >= 0.7) {
                implicitSignals.push({
                  id: uuidv4(),
                  sourceResultId: result.id,
                  signalType: validated.signalType,
                  inferredProblem: validated.inferredProblem,
                  confidence: validated.confidence,
                  evidence: validated.evidence,
                });
              }
            }
          } catch (error) {
            console.error(`[detect_implicit] LLM inference failed:`, error);
          }

          break; // One signal per result
        }
      }
    }
  }

  console.log(
    `[detect_implicit] Detected ${implicitSignals.length} implicit signals`
  );

  return {
    implicitSignals,
    status: "clustering",
    progress: {
      ...state.progress,
      currentNode: "detect_implicit",
      signalsDetected: implicitSignals.length,
    },
  };
}
```

#### 5. Cluster Problems Node (HDBSCAN)

```typescript
// src/agents/problem-discovery/nodes/cluster-problems.ts
import { ProblemDiscoveryStateType, ProblemCluster } from "../state";
import {
  generateEmbedding,
  batchGenerateEmbeddings,
} from "@/agents/tools/embedding";
import { openrouter } from "@/agents/tools/llm/openrouter";
import { v4 as uuidv4 } from "uuid";
import HDBSCAN from "hdbscanjs";

export async function clusterProblemsNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  console.log(
    `[cluster_problems] Clustering ${state.extractedProblems.length} problems...`
  );

  if (state.extractedProblems.length < 5) {
    console.log("[cluster_problems] Not enough problems to cluster");
    return {
      clusteredProblems: [],
      status: "saving",
      progress: {
        ...state.progress,
        currentNode: "cluster_problems",
        clustersFormed: 0,
      },
    };
  }

  // Generate embeddings for all problem statements
  const statements = state.extractedProblems.map((p) => p.statement);
  const embeddings = await batchGenerateEmbeddings(statements);

  // Run HDBSCAN clustering
  const clusterer = new HDBSCAN({
    minClusterSize: 3,
    minSamples: 2,
    metric: "cosine",
  });

  const labels = clusterer.fit(embeddings);

  // Group problems by cluster
  const clusterGroups = new Map<number, string[]>();
  labels.forEach((label, index) => {
    if (label === -1) return; // Noise points
    if (!clusterGroups.has(label)) {
      clusterGroups.set(label, []);
    }
    clusterGroups.get(label)!.push(state.extractedProblems[index].id);
  });

  console.log(`[cluster_problems] Found ${clusterGroups.size} clusters`);

  // Generate cluster summaries using LLM
  const clusteredProblems: ProblemCluster[] = [];

  for (const [clusterId, problemIds] of clusterGroups) {
    const clusterProblems = problemIds.map(
      (id) => state.extractedProblems.find((p) => p.id === id)!
    );

    const statementsText = clusterProblems
      .map((p) => `- ${p.statement}`)
      .join("\n");

    // Generate cluster theme
    const response = await openrouter.chat({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "user",
          content: `Analyze these related startup problems and provide a concise theme and description.

Problems:
${statementsText}

Respond with JSON:
{
  "theme": "Short theme (3-5 words)",
  "description": "1-2 sentence description of the common thread"
}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const { theme, description } = JSON.parse(
      response.choices[0].message.content
    );

    // Aggregate metadata
    const industries = [
      ...new Set(clusterProblems.map((p) => p.category.secondary)),
    ];

    const fundingStages = [
      ...new Set(clusterProblems.map((p) => p.startupId).filter(Boolean)),
    ];

    clusteredProblems.push({
      id: uuidv4(),
      theme,
      description,
      problemIds,
      size: problemIds.length,
      industries,
      fundingStages,
      growthRate: 0, // Calculate from historical data
    });
  }

  console.log(
    `[cluster_problems] Generated ${clusteredProblems.length} cluster summaries`
  );

  return {
    clusteredProblems,
    status: "saving",
    progress: {
      ...state.progress,
      currentNode: "cluster_problems",
      clustersFormed: clusteredProblems.length,
    },
  };
}
```

#### 6. Save to Database Node

```typescript
// src/agents/problem-discovery/nodes/save-to-db.ts
import { ProblemDiscoveryStateType, SavedProblem } from "../state";
import { convexMutation } from "@/agents/tools/data/convex";
import { generateEmbedding } from "@/agents/tools/embedding";

export async function saveToDbNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  console.log("[save_to_db] Persisting results to Convex...");

  const savedProblems: SavedProblem[] = [];
  const errors: ErrorInfo[] = [];

  // Save problems
  for (const problem of state.extractedProblems) {
    try {
      // Generate embedding for vector search
      const embedding = await generateEmbedding(problem.statement);

      const convexId = await convexMutation("startupProblems:create", {
        statement: problem.statement,
        category: problem.category,
        severity: problem.severity,
        frequency: problem.frequency,
        urgency: problem.urgency,
        addressability: problem.addressability,
        evidence: problem.evidence,
        embedding,
        sourceUrl: state.rawResults.find((r) => r.id === problem.sourceResultId)
          ?.url,
        sourcePlatform: state.rawResults.find(
          (r) => r.id === problem.sourceResultId
        )?.platform,
        discoveredAt: Date.now(),
        discoveryMethod: "social_scan",
      });

      savedProblems.push({
        convexId,
        problemId: problem.id,
        savedAt: new Date(),
      });
    } catch (error) {
      console.error(
        `[save_to_db] Failed to save problem ${problem.id}:`,
        error
      );
      errors.push({
        node: "save_to_db",
        error: `Failed to save problem: ${error}`,
        timestamp: new Date(),
        recoverable: true,
      });
    }
  }

  // Save implicit signals
  for (const signal of state.implicitSignals) {
    try {
      await convexMutation("implicitSignals:create", {
        signalType: signal.signalType,
        inferredProblem: signal.inferredProblem,
        confidence: signal.confidence,
        evidence: signal.evidence,
        sourceUrl: state.rawResults.find((r) => r.id === signal.sourceResultId)
          ?.url,
        detectedAt: Date.now(),
      });
    } catch (error) {
      console.error(`[save_to_db] Failed to save signal ${signal.id}:`, error);
    }
  }

  // Save problem clusters
  for (const cluster of state.clusteredProblems) {
    try {
      await convexMutation("problemClusters:create", {
        theme: cluster.theme,
        description: cluster.description,
        problemIds: cluster.problemIds,
        size: cluster.size,
        industries: cluster.industries,
        fundingStages: cluster.fundingStages,
        growthRate: cluster.growthRate,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error(
        `[save_to_db] Failed to save cluster ${cluster.id}:`,
        error
      );
    }
  }

  console.log(
    `[save_to_db] Saved ${savedProblems.length} problems, ${state.implicitSignals.length} signals, ${state.clusteredProblems.length} clusters`
  );

  return {
    savedProblems,
    status: "complete",
    progress: {
      ...state.progress,
      currentNode: "save_to_db",
    },
    errors: errors.length > 0 ? errors : undefined,
  };
}
```

---

## API Routes for Agent Control

```typescript
// src/app/api/agents/problem-discovery/trigger/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createProblemDiscoveryGraph } from "@/agents/problem-discovery/graph";
import { ConvexHttpClient } from "convex/browser";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convexClient = new ConvexHttpClient(
    process.env.NEXT_PUBLIC_CONVEX_URL!
  );
  const graph = createProblemDiscoveryGraph(convexClient);

  const threadId = uuidv4();

  // Create task record
  await convexClient.mutation("agentTasks:create", {
    taskId: threadId,
    agentType: "problem_discovery",
    status: "running",
    priority: "medium",
    payload: {},
    createdAt: Date.now(),
  });

  // Run graph in background
  graph
    .invoke(
      { searchQueries: [] }, // Initial state
      { configurable: { thread_id: threadId } }
    )
    .then(async (result) => {
      await convexClient.mutation("agentTasks:update", {
        taskId: threadId,
        status: "completed",
        result: {
          problemsFound: result.extractedProblems.length,
          signalsDetected: result.implicitSignals.length,
          clustersFormed: result.clusteredProblems.length,
        },
        completedAt: Date.now(),
      });
    })
    .catch(async (error) => {
      await convexClient.mutation("agentTasks:update", {
        taskId: threadId,
        status: "failed",
        error: error.message,
        completedAt: Date.now(),
      });
    });

  return NextResponse.json({
    taskId: threadId,
    message: "Problem discovery agent started",
  });
}
```

---

## Convex Functions (Data Persistence Only)

```typescript
// convex/startupProblems.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    statement: v.string(),
    category: v.object({
      primary: v.string(),
      secondary: v.string(),
      tertiary: v.optional(v.string()),
    }),
    severity: v.number(),
    frequency: v.string(),
    urgency: v.string(),
    addressability: v.number(),
    evidence: v.array(v.string()),
    embedding: v.array(v.float64()),
    sourceUrl: v.optional(v.string()),
    sourcePlatform: v.optional(v.string()),
    discoveredAt: v.number(),
    discoveryMethod: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("startupProblems", args);
  },
});

export const list = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
    minSeverity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("startupProblems");

    if (args.category) {
      q = q.filter((q) => q.eq(q.field("category.primary"), args.category));
    }

    if (args.minSeverity) {
      q = q.filter((q) => q.gte(q.field("severity"), args.minSeverity));
    }

    return await q.order("desc").take(args.limit || 50);
  },
});

export const search = query({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vector similarity search
    return await ctx.db
      .query("startupProblems")
      .withIndex("by_embedding")
      .order("desc")
      .take(args.limit || 20);
  },
});

// convex/implicitSignals.ts
export const create = mutation({
  args: {
    signalType: v.string(),
    inferredProblem: v.string(),
    confidence: v.number(),
    evidence: v.string(),
    sourceUrl: v.optional(v.string()),
    detectedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("implicitSignals", args);
  },
});

export const list = query({
  args: {
    signalType: v.optional(v.string()),
    minConfidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("implicitSignals");

    if (args.signalType) {
      q = q.filter((q) => q.eq(q.field("signalType"), args.signalType));
    }

    if (args.minConfidence) {
      q = q.filter((q) => q.gte(q.field("confidence"), args.minConfidence));
    }

    return await q.order("desc").take(50);
  },
});

// convex/problemClusters.ts
export const create = mutation({
  args: {
    theme: v.string(),
    description: v.string(),
    problemIds: v.array(v.string()),
    size: v.number(),
    industries: v.array(v.string()),
    fundingStages: v.array(v.string()),
    growthRate: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("problemClusters", args);
  },
});

export const list = query({
  args: {
    minSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("problemClusters");

    if (args.minSize) {
      q = q.filter((q) => q.gte(q.field("size"), args.minSize));
    }

    return await q.order("desc").take(50);
  },
});
```

---

## Shared Tools Integration (from Plan 7)

This agent uses the following shared tools from `src/agents/tools/`:

| Tool Category | Tools Used                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| **Search**    | `exaSearch`, `exaSimilaritySearch`, `tavilySearch`, `crunchbaseSearch`, `crunchbaseGetDetails` (RapidAPI) |
| **YouTube**   | `youtubeTranscript`, `youtubeBatchTranscripts` (for founder interviews, podcasts, pitch talks)            |
| **LLM**       | `openrouter.chat` (structured output with Zod)                                                            |
| **Embedding** | `generateEmbedding`, `batchGenerateEmbeddings`                                                            |
| **Data**      | `convexQuery`, `convexMutation`                                                                           |
| **Cache**     | `searchCache.get`, `searchCache.set`                                                                      |

See Plan 7 for full tool implementations.

### YouTube Transcript Use Cases

The YouTube Transcript tools enable discovery of pain points from video content:

1. **Founder Interviews** - YC Startup School talks, podcast appearances, conference keynotes
2. **Investor Q&A Sessions** - Questions asked reveal common challenges
3. **Product Demos** - Pain points mentioned when explaining "why we built this"
4. **Pivot Announcements** - Previous challenges that led to the pivot
5. **Hiring Videos** - Team challenges and growth problems mentioned

Example workflow:

```typescript
// Fetch transcript from founder interview
const transcript = await youtubeTranscriptTool.invoke({
  videoUrl: "https://youtube.com/watch?v=founder-talk-xyz",
  language: "en",
});

// Extract pain points from transcript
const painPoints = await extractProblemsFromText(transcript.data.fullText);
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] Define LangGraph state schema with Annotations
- [ ] Implement StateGraph with all nodes
- [ ] Set up ConvexCheckpointer for state persistence
- [ ] Integrate shared tools from Plan 7
- [ ] Create API routes for agent control

### Phase 2: Search & Discovery Nodes

- [ ] Implement search_channels node with Exa.ai
- [ ] Add Tavily fallback logic
- [ ] Create query templates for all discovery patterns
- [ ] Implement result deduplication

### Phase 3: Startup Tracking

- [ ] Implement sync_startups node
- [ ] Integrate Crunchbase API
- [ ] Create startup filtering logic
- [ ] Set up incremental sync (only new startups)

### Phase 4: Problem Extraction

- [ ] Implement extract_problems node
- [ ] Create LLM extraction prompts
- [ ] Add Zod schema validation
- [ ] Implement batch processing with rate limiting

### Phase 5: Advanced Detection

- [ ] Implement detect_implicit node
- [ ] Create pattern matching rules
- [ ] Add LLM inference for implicit signals
- [ ] Implement cluster_problems node with HDBSCAN

### Phase 6: Persistence & API

- [ ] Implement save_to_db node
- [ ] Create Convex mutations for all data types
- [ ] Add vector embedding generation
- [ ] Create API routes for triggering and status

---

## Verification Criteria

- [ ] LangGraph StateGraph compiles without errors
- [ ] Exa.ai search returns relevant results
- [ ] Fallback to Tavily works when Exa fails
- [ ] Crunchbase integration syncs Series A+ startups
- [ ] Pain points extracted with 85%+ accuracy
- [ ] Problems categorized correctly by LLM
- [ ] Severity scores correlate with urgency language
- [ ] Problem clustering produces coherent themes
- [ ] Implicit signals detected and validated
- [ ] ConvexCheckpointer persists state across runs
- [ ] Processing completes in <30 minutes for full scan
- [ ] All shared tools from Plan 7 integrate correctly
