# Plan 1: Foundation & Scaffolding

**Timeline:** Weeks 1-6
**Dependencies:** None
**Must Complete Before:** All other plans (plan_2 through plan_7)

---

## Overview

This plan establishes the core infrastructure for the Phronesis Research Intelligence Platform. It must be completed before any parallel development can begin on the other plans.

---

## Scope

- Project initialization (Next.js 14 App Router)
- Convex database setup with complete schema
- Clerk authentication integration
- shadcn/ui component library setup
- Base project structure
- Environment configuration
- Deployment infrastructure
- **LangGraph agent orchestration architecture**

---

## Key Deliverables

1. Next.js 14 project with App Router
2. Complete Convex schema (all 18+ tables including agent management)
3. Clerk OAuth 2.0 integration with MFA option
4. TailwindCSS + shadcn/ui configured
5. Environment configuration (.env.local)
6. Vercel + Convex Cloud deployment
7. Base file structure
8. **LangGraph orchestrator setup with OpenRouter integration**

---

## Git Worktree Usage

After this plan is complete, other plans can be worked on in parallel using git worktrees:

```bash
# After plan_1 is complete, create worktrees for parallel development
git worktree add ../phronesis-frontend feature/frontend
git worktree add ../phronesis-agent1 feature/research-agent
git worktree add ../phronesis-agent2 feature/problem-discovery
git worktree add ../phronesis-agent3 feature/linking-agent
git worktree add ../phronesis-trends feature/trends-analytics
git worktree add ../phronesis-tools feature/agent-tools
```

---

## PRD Sections Extracted

### Section 3: System Architecture Overview

#### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      PHRONESIS RESEARCH INTELLIGENCE PLATFORM                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         FRONTEND LAYER                                   │ │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐  │ │
│  │  │   Dashboard   │ │    Paper      │ │   Insights    │ │ Opportunity │  │ │
│  │  │     View      │ │   Explorer    │ │    Feed       │ │   Explorer  │  │ │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘  │ │
│  │  Next.js 14 App Router + shadcn/ui + TailwindCSS + Convex React Hooks   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                        │                                     │
│                                        ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         API LAYER (Convex)                              │ │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐  │ │
│  │  │   Queries     │ │   Mutations   │ │   Actions     │ │   HTTP      │  │ │
│  │  │  (Real-time)  │ │  (Transact.)  │ │ (Side-effects)│ │  Endpoints  │  │ │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                        │                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                   LANGGRAPH ORCHESTRATION LAYER                         │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    SUPERVISOR (Router Pattern)                     │  │ │
│  │  │  • Dynamic agent selection based on task type                     │  │ │
│  │  │  • Priority-based routing (critical > high > medium > low)        │  │ │
│  │  │  • Human-in-the-loop approval gates                               │  │ │
│  │  │  • State checkpointing via Convex                                 │  │ │
│  │  └───────────────────────────────────────────────────────────────────┘  │ │
│  │                              │                                          │ │
│  │         ┌────────────────────┼────────────────────┐                    │ │
│  │         ▼                    ▼                    ▼                    │ │
│  │  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐             │ │
│  │  │  Research   │      │  Problem    │      │   Trend     │             │ │
│  │  │  Discovery  │      │  Discovery  │      │  Analysis   │             │ │
│  │  │   Agent     │      │   Agent     │      │   Agent     │             │ │
│  │  └─────────────┘      └─────────────┘      └─────────────┘             │ │
│  │         │                    │                    │                    │ │
│  │         ▼                    ▼                    │                    │ │
│  │  ┌─────────────┐      ┌─────────────┐             │                    │ │
│  │  │  Insight    │      │  Research   │◄────────────┘                    │ │
│  │  │ Generation  │      │  Linking    │                                  │ │
│  │  │   Agent     │      │   Agent     │                                  │ │
│  │  └─────────────┘      └─────────────┘                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                        │                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      SHARED TOOL REGISTRY (Plan 7)                      │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │ │
│  │  │  Data    │ │  Search  │ │   LLM    │ │   PDF    │ │  Embedding   │  │ │
│  │  │  Tools   │ │  Tools   │ │  Tools   │ │  Tools   │ │    Tools     │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                        │                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                       EXTERNAL INTEGRATIONS                             │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────────┐ ┌──────────────┐  │ │
│  │  │  arXiv   │ │ Semantic │ │       EXA.AI           │ │  OpenRouter  │  │ │
│  │  │   API    │ │ Scholar  │ │  (Unified Web Search)  │ │  (LLM API)   │  │ │
│  │  └──────────┘ └──────────┘ │ Reddit, Twitter, HN,   │ └──────────────┘  │ │
│  │  ┌──────────┐ ┌──────────┐ │ GitHub, G2, LinkedIn,  │ ┌──────────────┐  │ │
│  │  │Crunchbase│ │  Tavily  │ │ SO, Glassdoor, etc.    │ │   Convex     │  │ │
│  │  │   API    │ │ (Backup) │ └────────────────────────┘ │  (Database)  │  │ │
│  │  └──────────┘ └──────────┘                            └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2 Technology Stack

| Layer                   | Technology                 | Justification                                        |
| ----------------------- | -------------------------- | ---------------------------------------------------- |
| **Frontend Framework**  | Next.js 14 (App Router)    | Server components, streaming, excellent DX           |
| **UI Components**       | shadcn/ui                  | Customizable, accessible, modern design system       |
| **Styling**             | TailwindCSS                | Utility-first, consistent design tokens              |
| **State Management**    | Convex React hooks         | Real-time sync, optimistic updates                   |
| **Database**            | Convex                     | Real-time, serverless, TypeScript-native             |
| **Agent Orchestration** | LangGraph                  | StateGraph pattern, checkpointing, human-in-the-loop |
| **LLM Provider**        | OpenRouter                 | Unified API for Claude, GPT-4, etc.                  |
| **Vector Search**       | Convex Vector Search       | Built-in, no additional infrastructure               |
| **File Storage**        | Convex File Storage        | Integrated with database                             |
| **Visualization**       | D3.js + Mermaid + Recharts | Flexible charting and diagramming                    |
| **Web Search**          | Exa.ai                     | Semantic search across all platforms                 |
| **Backup Search**       | Tavily                     | Fallback and real-time news                          |

#### 3.3 LangGraph Orchestration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Supervisor Pattern)                 │
│                                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────────┐  │
│  │  Route   │-->│  Decide  │-->│  Invoke  │-->│ Collect Results  │  │
│  │  Tasks   │   │  Agent   │   │  Worker  │   │   & Route Next   │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────────────┘  │
│       ^                                              │               │
│       └──────────────────────────────────────────────┘               │
│                                                                      │
│  Decision Logic:                                                     │
│  - Event-based triggers (new paper, new problem, user request)      │
│  - Priority-based routing (critical > high > medium > low)          │
│  - Resource availability (rate limits, concurrent tasks)            │
│  - Human-in-the-loop gates (approval checkpoints)                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         v                    v                    v
   ┌──────────┐         ┌──────────┐         ┌──────────┐
   │ Research │         │ Problem  │         │  Trend   │
   │ Discovery│         │ Discovery│         │ Analysis │
   └──────────┘         └──────────┘         └──────────┘
         │                    │                    │
         v                    v                    v
   ┌──────────┐         ┌──────────┐
   │ Insight  │         │ Research │
   │ Generate │         │ Linking  │
   └──────────┘         └──────────┘
```

#### 3.4 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW DIAGRAM                             │
└─────────────────────────────────────────────────────────────────────────┘

      ┌─────────────────┐                      ┌─────────────────┐
      │    arXiv.org    │                      │     EXA.AI      │
      │   (Papers)      │                      │ (Unified Search)│
      └────────┬────────┘                      │ Reddit/Twitter/ │
               │ RSS/API                       │ HN/GitHub/G2... │
               ▼                               └────────┬────────┘
┌──────────────────────────────┐                        │ Semantic API
│  LANGGRAPH: Research Agent   │          ┌─────────────▼───────────────┐
│  ┌────────────────────────┐  │          │    STARTUP DATA SOURCES     │
│  │ StateGraph:            │  │          │  ┌────────────────────────┐ │
│  │ START -> fetch_arxiv   │  │          │  │ Crunchbase (Series A+) │ │
│  │   -> process_papers    │  │          │  │ + Exa search results   │ │
│  │   -> END               │  │          │  └────────────────────────┘ │
│  └────────────────────────┘  │          └─────────────┬───────────────┘
└──────────────┬───────────────┘                        │
               │                                        │
               │                                        │
               ▼                                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           CONVEX DATABASE                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Papers    │  │  Insights   │  │  Startups    │  │   Problems     │  │
│  │ + Content   │  │ + Embeddings│  │ + Funding    │  │  + Evidence    │  │
│  └─────────────┘  └─────────────┘  └──────────────┘  └────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐                      │
│  │   Agent     │  │   Agent     │  │    Agent     │                      │
│  │ Checkpoints │  │   Tasks     │  │  Approvals   │                      │
│  └─────────────┘  └─────────────┘  └──────────────┘                      │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼
              ┌──────────────────────────────────┐
              │ LANGGRAPH: Research Linking Agent│
              │  ┌────────────────────────────┐  │
              │  │ StateGraph:                │  │
              │  │ START -> load_problem      │  │
              │  │   -> find_candidates       │  │
              │  │   -> score_matches         │  │
              │  │   -> [human_approval?]     │  │
              │  │   -> save_links            │  │
              │  │   -> generate_report -> END│  │
              │  └────────────────────────────┘  │
              └──────────────┬───────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │        USER INTERFACE        │
              │  ┌────────────────────────┐  │
              │  │ • Research Dashboard   │  │
              │  │ • Startup Problems     │  │
              │  │ • Research Links       │  │
              │  │ • Solution Reports     │  │
              │  │ • Agent Monitoring     │  │
              │  │ • Approval Queue       │  │
              │  └────────────────────────┘  │
              └──────────────────────────────┘
```

---

### Section 5.5: Database & Data Layer - Complete Convex Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // PAPERS & CONTENT
  // ============================================
  papers: defineTable({
    arxivId: v.string(),
    title: v.string(),
    authors: v.array(
      v.object({
        name: v.string(),
        affiliations: v.optional(v.array(v.string())),
      })
    ),
    abstract: v.string(),
    categories: v.array(v.string()),
    primaryCategory: v.string(),
    publishedDate: v.number(),
    updatedDate: v.number(),
    pdfUrl: v.string(),
    pdfStorageId: v.optional(v.id("_storage")),
    processingStatus: v.union(
      v.literal("pending"),
      v.literal("fetching"),
      v.literal("analyzing"),
      v.literal("complete"),
      v.literal("failed")
    ),
    processingError: v.optional(v.string()),
    version: v.number(),
    citationCount: v.optional(v.number()),
    doi: v.optional(v.string()),
  })
    .index("by_arxiv_id", ["arxivId"])
    .index("by_status", ["processingStatus"])
    .index("by_category", ["primaryCategory"])
    .index("by_date", ["publishedDate"])
    .searchIndex("search_papers", {
      searchField: "title",
      filterFields: ["primaryCategory", "processingStatus"],
    }),

  paperContent: defineTable({
    paperId: v.id("papers"),
    sections: v.array(
      v.object({
        type: v.string(),
        title: v.string(),
        content: v.string(),
        pageNumbers: v.array(v.number()),
      })
    ),
    figures: v.array(
      v.object({
        figureNumber: v.string(),
        caption: v.string(),
        imageStorageId: v.id("_storage"),
        pageNumber: v.number(),
      })
    ),
    tables: v.array(
      v.object({
        tableNumber: v.string(),
        caption: v.string(),
        headers: v.array(v.string()),
        rows: v.array(v.array(v.string())),
        pageNumber: v.number(),
      })
    ),
    equations: v.array(
      v.object({
        latex: v.string(),
        context: v.string(),
        equationNumber: v.optional(v.string()),
      })
    ),
    references: v.array(
      v.object({
        referenceNumber: v.number(),
        rawText: v.string(),
        parsedTitle: v.optional(v.string()),
        arxivId: v.optional(v.string()),
      })
    ),
    processingTimestamp: v.number(),
  }).index("by_paper", ["paperId"]),

  // ============================================
  // INSIGHTS
  // ============================================
  insights: defineTable({
    paperId: v.id("papers"),
    problemStatement: v.string(),
    proposedSolution: v.string(),
    technicalApproach: v.string(),
    mainResults: v.string(),
    contributions: v.array(
      v.object({
        rank: v.number(),
        contribution: v.string(),
        noveltyScore: v.number(),
        evidenceStrength: v.number(),
      })
    ),
    statedLimitations: v.array(v.string()),
    inferredWeaknesses: v.array(v.string()),
    reproducibilityScore: v.number(),
    industryApplications: v.array(
      v.object({
        industry: v.string(),
        application: v.string(),
        feasibility: v.string(),
      })
    ),
    technologyReadinessLevel: v.number(),
    timeToCommercial: v.string(),
    enablingTechnologies: v.array(v.string()),
    summaries: v.object({
      technical: v.string(),
      executive: v.string(),
      tweet: v.string(),
      eli5: v.string(),
    }),
    analysisTimestamp: v.number(),
    modelVersion: v.string(),
    confidenceScore: v.number(),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_paper", ["paperId"])
    .index("by_trl", ["technologyReadinessLevel"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["technologyReadinessLevel"],
    }),

  // ============================================
  // DIAGRAMS
  // ============================================
  diagrams: defineTable({
    paperId: v.id("papers"),
    insightId: v.optional(v.id("insights")),
    diagramType: v.string(),
    title: v.string(),
    description: v.string(),
    format: v.string(),
    content: v.string(),
    generatedAt: v.number(),
  })
    .index("by_paper", ["paperId"])
    .index("by_insight", ["insightId"]),

  // ============================================
  // TRENDS
  // ============================================
  trends: defineTable({
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
    topPapers: v.array(v.id("papers")),
    relatedTrends: v.array(v.string()),
    forecast: v.object({
      direction: v.string(),
      confidence: v.number(),
    }),
    computedAt: v.number(),
  })
    .index("by_trend_id", ["trendId"])
    .index("by_status", ["status"]),

  // ============================================
  // STARTUPS (Tracked Series A+ Companies)
  // ============================================
  startups: defineTable({
    name: v.string(),
    description: v.string(),
    website: v.optional(v.string()),
    crunchbaseUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    twitterHandle: v.optional(v.string()),
    fundingStage: v.union(
      v.literal("series_a"),
      v.literal("series_b"),
      v.literal("series_c"),
      v.literal("series_d_plus")
    ),
    totalFunding: v.optional(v.number()),
    lastFundingDate: v.optional(v.number()),
    foundedDate: v.optional(v.number()),
    employeeCount: v.optional(
      v.object({
        min: v.number(),
        max: v.number(),
      })
    ),
    industries: v.array(v.string()),
    headquarters: v.optional(v.string()),
    founders: v.array(
      v.object({
        name: v.string(),
        linkedinUrl: v.optional(v.string()),
        twitterHandle: v.optional(v.string()),
      })
    ),
    investors: v.array(v.string()),
    isTracked: v.boolean(),
    lastUpdated: v.number(),
    dataSource: v.string(),
  })
    .index("by_funding_stage", ["fundingStage"])
    .index("by_tracked", ["isTracked"])
    .index("by_industry", ["industries"])
    .searchIndex("search_startups", {
      searchField: "name",
      filterFields: ["fundingStage", "isTracked"],
    }),

  // ============================================
  // STARTUP PROBLEMS (Discovered Pain Points)
  // ============================================
  startupProblems: defineTable({
    startupId: v.optional(v.id("startups")),
    problemStatement: v.string(),
    category: v.object({
      primary: v.string(),
      secondary: v.optional(v.string()),
      tertiary: v.optional(v.string()),
    }),
    severity: v.number(),
    frequency: v.number(),
    urgency: v.number(),
    addressability: v.number(),
    discoveryMethod: v.union(
      v.literal("explicit_mention"),
      v.literal("implicit_signal"),
      v.literal("review_mining"),
      v.literal("job_posting_analysis"),
      v.literal("github_issues"),
      v.literal("postmortem_extraction"),
      v.literal("cohort_prediction"),
      v.literal("network_intelligence")
    ),
    evidence: v.array(
      v.object({
        source: v.union(
          v.literal("reddit"),
          v.literal("twitter"),
          v.literal("hackernews"),
          v.literal("linkedin"),
          v.literal("github"),
          v.literal("g2"),
          v.literal("capterra"),
          v.literal("glassdoor"),
          v.literal("stackoverflow"),
          v.literal("youtube"),
          v.literal("podcast"),
          v.literal("job_posting"),
          v.literal("app_review"),
          v.literal("support_forum"),
          v.literal("conference"),
          v.literal("postmortem"),
          v.literal("other")
        ),
        url: v.string(),
        content: v.string(),
        author: v.optional(v.string()),
        authorCredibility: v.optional(v.number()),
        postedAt: v.number(),
        engagement: v.optional(
          v.object({
            likes: v.optional(v.number()),
            comments: v.optional(v.number()),
            shares: v.optional(v.number()),
          })
        ),
        isImplicit: v.optional(v.boolean()),
        implicitSignalType: v.optional(v.string()),
      })
    ),
    relatedProblems: v.array(v.id("startupProblems")),
    clusterTheme: v.optional(v.string()),
    affectedStartupCount: v.number(),
    predictedForStages: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("new"),
      v.literal("validated"),
      v.literal("researching"),
      v.literal("linked"),
      v.literal("archived")
    ),
    discoveredAt: v.number(),
    lastUpdated: v.number(),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_startup", ["startupId"])
    .index("by_category", ["category.primary"])
    .index("by_severity", ["severity"])
    .index("by_status", ["status"])
    .index("by_discovery_method", ["discoveryMethod"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["status", "category.primary"],
    }),

  // ============================================
  // FOUNDER NETWORK (For Network Intelligence)
  // ============================================
  founders: defineTable({
    name: v.string(),
    twitterHandle: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    currentStartupId: v.optional(v.id("startups")),
    previousStartups: v.array(
      v.object({
        name: v.string(),
        outcome: v.optional(v.string()),
      })
    ),
    credibilityScore: v.number(),
    followerCount: v.optional(v.number()),
    isActiveSharer: v.boolean(),
    topics: v.array(v.string()),
    lastActivityAt: v.number(),
  })
    .index("by_twitter", ["twitterHandle"])
    .index("by_credibility", ["credibilityScore"]),

  // ============================================
  // IMPLICIT SIGNALS (For Implicit Problem Detection)
  // ============================================
  implicitSignals: defineTable({
    sourceType: v.string(),
    sourceUrl: v.string(),
    signalType: v.union(
      v.literal("build_vs_buy"),
      v.literal("excessive_hiring"),
      v.literal("workaround_sharing"),
      v.literal("migration_announcement"),
      v.literal("open_source_creation"),
      v.literal("integration_complaint"),
      v.literal("scale_breakpoint"),
      v.literal("manual_process")
    ),
    rawContent: v.string(),
    inferredProblem: v.string(),
    confidence: v.number(),
    startupId: v.optional(v.id("startups")),
    convertedToProblemId: v.optional(v.id("startupProblems")),
    detectedAt: v.number(),
  })
    .index("by_signal_type", ["signalType"])
    .index("by_startup", ["startupId"]),

  // ============================================
  // RESEARCH-PROBLEM LINKS
  // ============================================
  researchLinks: defineTable({
    problemId: v.id("startupProblems"),
    insightId: v.id("insights"),
    paperId: v.id("papers"),
    matchScore: v.number(),
    scores: v.object({
      technicalFit: v.number(),
      trlGap: v.number(),
      timeToValue: v.number(),
      novelty: v.number(),
      evidenceStrength: v.number(),
    }),
    matchReasoning: v.string(),
    applicability: v.union(
      v.literal("direct"),
      v.literal("complementary"),
      v.literal("partial"),
      v.literal("future_potential")
    ),
    implementationRoadmap: v.optional(
      v.object({
        phases: v.array(
          v.object({
            name: v.string(),
            duration: v.string(),
            description: v.string(),
          })
        ),
        estimatedEffort: v.string(),
        estimatedImpact: v.string(),
      })
    ),
    status: v.union(
      v.literal("auto_matched"),
      v.literal("validated"),
      v.literal("rejected"),
      v.literal("implemented")
    ),
    createdAt: v.number(),
    validatedAt: v.optional(v.number()),
    validatedBy: v.optional(v.id("users")),
  })
    .index("by_problem", ["problemId"])
    .index("by_insight", ["insightId"])
    .index("by_paper", ["paperId"])
    .index("by_score", ["matchScore"])
    .index("by_status", ["status"]),

  // ============================================
  // SOLUTION SYNTHESIS REPORTS
  // ============================================
  solutionReports: defineTable({
    problemId: v.id("startupProblems"),
    linkedResearch: v.array(v.id("researchLinks")),
    title: v.string(),
    executiveSummary: v.string(),
    problemAnalysis: v.object({
      statement: v.string(),
      affectedStartups: v.number(),
      severity: v.number(),
      currentSolutions: v.array(
        v.object({
          name: v.string(),
          limitations: v.array(v.string()),
        })
      ),
    }),
    researchSynthesis: v.object({
      keyFindings: v.array(v.string()),
      combinedApproach: v.string(),
      novelContributions: v.array(v.string()),
    }),
    implementationPlan: v.object({
      recommendedApproach: v.string(),
      phases: v.array(
        v.object({
          phase: v.number(),
          name: v.string(),
          duration: v.string(),
          description: v.string(),
          researchUsed: v.array(v.id("papers")),
        })
      ),
      estimatedImpact: v.string(),
      complexity: v.string(),
      risks: v.array(v.string()),
    }),
    generatedAt: v.number(),
    modelVersion: v.string(),
  }).index("by_problem", ["problemId"]),

  // ============================================
  // USER DATA
  // ============================================
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    preferences: v.object({
      categories: v.array(v.string()),
      alertFrequency: v.string(),
      trlRange: v.object({
        min: v.number(),
        max: v.number(),
      }),
    }),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    itemType: v.string(),
    itemId: v.string(),
    notes: v.optional(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // ============================================
  // LANGGRAPH AGENT MANAGEMENT
  // ============================================

  // Agent run history (existing, enhanced)
  agentRuns: defineTable({
    agentType: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("awaiting_approval")
    ),
    triggeredBy: v.string(),
    threadId: v.string(),
    config: v.any(),
    progress: v.object({
      total: v.number(),
      processed: v.number(),
      failed: v.number(),
    }),
    results: v.optional(v.any()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_type", ["agentType"])
    .index("by_status", ["status"])
    .index("by_thread", ["threadId"]),

  // LangGraph state persistence
  agentCheckpoints: defineTable({
    threadId: v.string(),
    data: v.string(), // JSON serialized LangGraph state
    metadata: v.object({
      source: v.string(),
      step: v.number(),
      writes: v.optional(v.any()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_thread", ["threadId"]),

  // Task queue management
  agentTasks: defineTable({
    taskId: v.string(),
    agentType: v.union(
      v.literal("research_discovery"),
      v.literal("problem_discovery"),
      v.literal("research_linking"),
      v.literal("trend_analysis"),
      v.literal("insight_generation")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("awaiting_approval")
    ),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    payload: v.any(),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    threadId: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_agent_type", ["agentType"])
    .index("by_priority", ["priority"])
    .index("by_thread", ["threadId"]),

  // Human-in-the-loop approval queue
  agentApprovals: defineTable({
    requestId: v.string(),
    taskId: v.string(),
    threadId: v.string(),
    agentType: v.string(),
    description: v.string(),
    data: v.any(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    decidedBy: v.optional(v.id("users")),
    decidedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    requestedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_thread", ["threadId"])
    .index("by_task", ["taskId"]),
});
```

---

### Section 6: Technical Specifications

#### 6.1 Technology Stack Details

| Component               | Technology  | Version                | Purpose                               |
| ----------------------- | ----------- | ---------------------- | ------------------------------------- |
| **Frontend**            | Next.js     | 14.x                   | React framework with App Router       |
| **UI Library**          | shadcn/ui   | Latest                 | Accessible component library          |
| **Styling**             | TailwindCSS | 3.x                    | Utility-first CSS                     |
| **Database**            | Convex      | Latest                 | Real-time serverless database         |
| **Auth**                | Clerk       | Latest                 | Authentication provider               |
| **Agent Orchestration** | LangGraph   | Latest                 | StateGraph-based agent workflows      |
| **LLM Provider**        | OpenRouter  | Latest                 | Unified LLM API (Claude, GPT-4, etc.) |
| **Embeddings**          | OpenAI      | text-embedding-3-small | Vector embeddings                     |
| **PDF Processing**      | PyMuPDF     | 1.23.x                 | PDF text/image extraction             |
| **Diagrams**            | Mermaid.js  | 10.x                   | Diagram rendering                     |
| **Charts**              | Recharts    | 2.x                    | Data visualization                    |
| **Graphs**              | D3.js       | 7.x                    | Complex visualizations                |

#### 6.2 OpenRouter Integration

```typescript
// src/agents/tools/llm/openrouter.ts
import { ChatOpenAI } from "@langchain/openai";

export const createOpenRouterClient = (
  model: string = "anthropic/claude-3.5-sonnet"
) => {
  return new ChatOpenAI({
    modelName: model,
    openAIApiKey: process.env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://phronesis.app",
        "X-Title": "Phronesis Research Platform",
      },
    },
  });
};

// Available models via OpenRouter
export const MODELS = {
  CLAUDE_SONNET: "anthropic/claude-3.5-sonnet",
  CLAUDE_OPUS: "anthropic/claude-3-opus",
  GPT4_TURBO: "openai/gpt-4-turbo",
  GPT4O: "openai/gpt-4o",
  GEMINI_PRO: "google/gemini-pro-1.5",
} as const;
```

#### 6.3 API Rate Limits & Quotas

| Service           | Limit                                        | Handling Strategy                  |
| ----------------- | -------------------------------------------- | ---------------------------------- |
| arXiv API         | 1 request/3 seconds                          | Queue with delay, batch fetching   |
| OpenRouter API    | Varies by plan                               | Token budgeting, caching           |
| OpenAI Embeddings | 3000 RPM                                     | Batch embedding requests           |
| **Exa.ai API**    | 1000 requests/month (Starter), 10K+ (Growth) | Query optimization, result caching |
| Tavily API        | 1000 requests/month (Free), unlimited (Pro)  | Fallback only, caching             |
| Crunchbase API    | 200 requests/min                             | Batch fetching, daily sync         |

---

### Section 10: Security & Compliance

#### 10.1 Security Requirements

| Requirement        | Implementation                         | Priority |
| ------------------ | -------------------------------------- | -------- |
| Authentication     | Clerk OAuth 2.0 with MFA option        | P0       |
| Authorization      | Convex row-level security              | P0       |
| Data Encryption    | TLS 1.3 in transit, AES-256 at rest    | P0       |
| API Key Management | Environment variables, secret rotation | P0       |
| Audit Logging      | All agent runs and data access logged  | P1       |
| Input Validation   | Convex validators on all endpoints     | P0       |

#### 10.2 Compliance Considerations

**arXiv Terms of Use:**

- Respect rate limits (1 request per 3 seconds)
- Include attribution for arXiv data
- Do not redistribute PDFs
- Link back to original arXiv pages

**Data Privacy (GDPR/CCPA):**

- User data limited to authentication essentials
- Right to deletion supported
- Data portability on request

**AI/LLM Compliance:**

- Clear disclosure that insights are AI-generated
- No medical, legal, or financial advice
- Model version tracking for reproducibility

---

### Section 12: Deployment & Infrastructure

#### 12.1 Deployment Architecture

**Frontend:** Vercel (Next.js)

- Automatic deployments
- Preview deployments
- Edge caching
- Analytics

**Backend:** Convex Cloud

- Automatic scaling
- Real-time sync
- Vector search
- File storage

**Agent Runtime:** LangGraph

- State persistence via Convex checkpointer
- Event-driven execution
- Human-in-the-loop via Convex mutations

#### 12.2 Environment Configuration

```bash
# .env.local (Frontend)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Convex Dashboard Environment Variables
OPENROUTER_API_KEY=sk-or-...
OPENAI_API_KEY=sk-...
CLERK_WEBHOOK_SECRET=whsec_...
EXA_API_KEY=...
TAVILY_API_KEY=...
CRUNCHBASE_API_KEY=...
```

---

### Appendix C: Base File Structure

```
phronesis/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes
│   ├── (dashboard)/              # Main app routes
│   │   ├── page.tsx              # Dashboard
│   │   ├── research/             # Paper explorer
│   │   ├── insights/             # Insights feed
│   │   ├── trends/               # Trends overview
│   │   ├── problems/             # Startup problems
│   │   │   ├── page.tsx          # Problem list
│   │   │   └── [id]/             # Problem detail
│   │   ├── startups/             # Startup tracker
│   │   ├── links/                # Research-problem links
│   │   ├── agents/               # Agent monitoring (NEW)
│   │   │   ├── page.tsx          # Agent dashboard
│   │   │   ├── tasks/            # Task queue
│   │   │   └── approvals/        # Approval queue
│   │   └── settings/             # User settings
│   ├── api/                      # API routes
│   │   ├── webhooks/             # Clerk webhooks
│   │   └── agents/               # Agent control endpoints (NEW)
│   │       ├── trigger/route.ts  # Trigger agent tasks
│   │       ├── status/route.ts   # Get task status
│   │       ├── approve/route.ts  # Human approval
│   │       └── cancel/route.ts   # Cancel running task
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── papers/                   # Paper components
│   ├── insights/                 # Insight components
│   ├── trends/                   # Trend components
│   ├── problems/                 # Problem components
│   ├── startups/                 # Startup components
│   ├── links/                    # Research link components
│   ├── diagrams/                 # Diagram renderers
│   └── agents/                   # Agent monitoring components (NEW)
│       ├── AgentDashboard.tsx
│       ├── TaskQueue.tsx
│       ├── ApprovalQueue.tsx
│       └── AgentStatusCard.tsx
├── src/
│   └── agents/                   # LangGraph agents (NEW)
│       ├── orchestrator/         # Central orchestrator
│       │   ├── graph.ts          # Supervisor StateGraph
│       │   ├── state.ts          # Orchestrator state
│       │   └── nodes.ts          # Router nodes
│       ├── research/             # Research Discovery Agent
│       │   ├── graph.ts          # Agent StateGraph
│       │   ├── state.ts          # Agent state schema
│       │   └── nodes/            # Node implementations
│       ├── problem/              # Problem Discovery Agent
│       │   ├── graph.ts
│       │   ├── state.ts
│       │   └── nodes/
│       ├── linking/              # Research Linking Agent
│       │   ├── graph.ts
│       │   ├── state.ts
│       │   └── nodes/
│       ├── trends/               # Trend Analysis Agent
│       │   ├── graph.ts
│       │   ├── state.ts
│       │   └── nodes/
│       ├── tools/                # Shared tool registry (Plan 7)
│       │   ├── index.ts
│       │   ├── data/
│       │   ├── search/
│       │   ├── llm/
│       │   ├── pdf/
│       │   ├── embedding/
│       │   └── cache/
│       └── checkpointer/         # Convex checkpointer
│           └── convex.ts
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── papers.ts                 # Paper functions
│   ├── insights.ts               # Insight functions
│   ├── trends.ts                 # Trend functions
│   ├── startups.ts               # Startup functions
│   ├── problems.ts               # Problem functions
│   ├── researchLinks.ts          # Research link functions
│   ├── solutionReports.ts        # Solution report functions
│   ├── agentRuns.ts              # Agent run tracking (NEW)
│   ├── agentTasks.ts             # Task queue management (NEW)
│   ├── agentApprovals.ts         # Approval queue (NEW)
│   └── agentCheckpoints.ts       # LangGraph state persistence (NEW)
├── lib/                          # Shared utilities
│   ├── search/                   # Unified search layer
│   ├── startup-data/             # Startup data enrichment
│   ├── discovery/                # Discovery algorithms
│   └── cache/                    # Search result caching
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
└── public/                       # Static assets
```

---

## Implementation Checklist

### Week 1-2: Project Setup

- [ ] Initialize Next.js 14 project with App Router
- [ ] Configure TailwindCSS
- [ ] Install and configure shadcn/ui
- [ ] Set up project file structure
- [ ] Configure ESLint and Prettier
- [ ] Install LangGraph dependencies (`@langchain/langgraph`, `@langchain/openai`)

### Week 3-4: Database & Auth

- [ ] Initialize Convex project
- [ ] Implement complete schema (all 18+ tables including agent management)
- [ ] Set up Clerk authentication
- [ ] Configure Convex-Clerk integration
- [ ] Implement row-level security
- [ ] Create agentCheckpoints, agentTasks, agentApprovals tables

### Week 5-6: Deployment & Agent Infrastructure

- [ ] Deploy to Vercel
- [ ] Deploy Convex to production
- [ ] Configure environment variables (including OPENROUTER_API_KEY)
- [ ] Set up CI/CD pipeline
- [ ] Implement Convex checkpointer for LangGraph
- [ ] Create base orchestrator StateGraph structure
- [ ] Verify all integrations working

---

## Verification Criteria

- [ ] Next.js 14 app runs locally without errors
- [ ] All Convex tables created with correct indexes (18+ tables)
- [ ] Clerk authentication flow works end-to-end
- [ ] shadcn/ui components render correctly
- [ ] Deployment to Vercel successful
- [ ] Convex Cloud deployment successful
- [ ] Environment variables configured in all environments
- [ ] LangGraph imports resolve correctly
- [ ] OpenRouter client connects successfully
- [ ] Convex checkpointer persists and retrieves state
