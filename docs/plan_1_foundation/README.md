# Plan 1: Foundation & Scaffolding

**Timeline:** Weeks 1-6
**Dependencies:** None
**Must Complete Before:** All other plans (plan_2 through plan_6)

---

## Overview

This plan establishes the core infrastructure for the ArXiv Research Intelligence Platform. It must be completed before any parallel development can begin on the other plans.

---

## Scope

- Project initialization (Next.js 14 App Router)
- Convex database setup with complete schema
- Clerk authentication integration
- shadcn/ui component library setup
- Base project structure
- Environment configuration
- Deployment infrastructure

---

## Key Deliverables

1. Next.js 14 project with App Router
2. Complete Convex schema (all 15+ tables)
3. Clerk OAuth 2.0 integration with MFA option
4. TailwindCSS + shadcn/ui configured
5. Environment configuration (.env.local)
6. Vercel + Convex Cloud deployment
7. Base file structure

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
```

---

## PRD Sections Extracted

### Section 3: System Architecture Overview

#### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ARXIV RESEARCH INTELLIGENCE PLATFORM                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         FRONTEND LAYER                                   │ │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐  │ │
│  │  │   Dashboard   │ │    Paper      │ │   Insights    │ │ Opportunity │  │ │
│  │  │     View      │ │   Explorer    │ │    Feed       │ │   Explorer  │  │ │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘  │ │
│  │  Next.js 14 App Router + shadcn/ui + TailwindCSS + React Query          │ │
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
│          ┌─────────────────────────────┼─────────────────────────────┐      │
│          ▼                             ▼                             ▼      │
│  ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────────┐│
│  │  RESEARCH AGENT   │    │  PROBLEM DISCOVERY│    │      DATABASE         ││
│  │     (Agent 1)     │    │   AGENT (Agent 2) │    │      (Convex)         ││
│  │                   │    │                   │    │                       ││
│  │ • arXiv Fetcher   │    │ • Reddit Scanner  │    │ • Papers              ││
│  │ • PDF Parser      │    │ • Twitter/X API   │    │ • Insights            ││
│  │ • LLM Analyzer    │    │ • Startup DB API  │    │ • Startup Problems    ││
│  │ • Diagram Gen     │    │ • Pain Point      │    │ • Problem-Research    ││
│  │ • Insight Writer  │    │   Extractor       │    │   Links               ││
│  └───────────────────┘    └───────────────────┘    └───────────────────────┘│
│          │                         │                         ▲              │
│          │                         ▼                         │              │
│          │                ┌───────────────────┐              │              │
│          │                │  RESEARCH LINKING │              │              │
│          └───────────────►│   AGENT (Agent 3) │──────────────┘              │
│                           │                   │                             │
│                           │ • Problem-Research│                             │
│                           │   Matcher         │                             │
│                           │ • Relevance Score │                             │
│                           │ • Solution Synth. │                             │
│                           │ • Report Builder  │                             │
│                           └───────────────────┘                             │
│          │                             │                                     │
│          ▼                             ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      AGENT RUNTIME ENVIRONMENT                          │ │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐  │ │
│  │  │    Docker     │ │   Browser     │ │     File      │ │    Tool     │  │ │
│  │  │   Container   │ │  Automation   │ │    System     │ │  Registry   │  │ │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                       EXTERNAL INTEGRATIONS                             │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────────┐ ┌──────────────┐  │ │
│  │  │  arXiv   │ │ Semantic │ │       EXA.AI           │ │   LLM APIs   │  │ │
│  │  │   API    │ │ Scholar  │ │  (Unified Web Search)  │ │  (Anthropic) │  │ │
│  │  └──────────┘ └──────────┘ │ Reddit, Twitter, HN,   │ └──────────────┘  │ │
│  │  ┌──────────┐ ┌──────────┐ │ GitHub, G2, LinkedIn,  │ ┌──────────────┐  │ │
│  │  │Crunchbase│ │  Tavily  │ │ SO, Glassdoor, etc.    │ │  Perplexity  │  │ │
│  │  │   API    │ │ (Backup) │ └────────────────────────┘ │  (Real-time) │  │ │
│  │  └──────────┘ └──────────┘                            └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend Framework** | Next.js 14 (App Router) | Server components, streaming, excellent DX |
| **UI Components** | shadcn/ui | Customizable, accessible, modern design system |
| **Styling** | TailwindCSS | Utility-first, consistent design tokens |
| **State Management** | Convex React hooks | Real-time sync, optimistic updates |
| **Database** | Convex | Real-time, serverless, TypeScript-native |
| **Agent Runtime** | Docker + Python | Isolated execution, rich ML ecosystem |
| **LLM Provider** | Anthropic Claude | Superior reasoning, long context windows |
| **Vector Search** | Convex Vector Search | Built-in, no additional infrastructure |
| **File Storage** | Convex File Storage | Integrated with database |
| **Visualization** | D3.js + Mermaid + Recharts | Flexible charting and diagramming |
| **Web Search** | Exa.ai | Semantic search across all platforms, eliminates 15+ API integrations |
| **Backup Search** | Tavily / Perplexity | Fallback and real-time news |

#### 3.3 Data Flow Architecture

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
│     RESEARCH INGESTION       │          ┌─────────────▼───────────────┐
│  ┌────────────────────────┐  │          │    STARTUP DATA SOURCES     │
│  │ 1. Fetch new papers    │  │          │  ┌────────────────────────┐ │
│  │ 2. Download PDFs       │  │          │  │ Crunchbase (Series A+) │ │
│  │ 3. Extract metadata    │  │          │  │ + Exa search results   │ │
│  └────────────────────────┘  │          │  └────────────────────────┘ │
└──────────────┬───────────────┘          └─────────────┬───────────────┘
               │                                        │
               │                                        │
               ▼                                        ▼
┌──────────────────────────────┐      ┌──────────────────────────────────┐
│  RESEARCH AGENT (Agent 1)    │      │ PROBLEM DISCOVERY AGENT (Agent 2)│
│  ┌────────────────────────┐  │      │  ┌────────────────────────────┐  │
│  │ 1. Parse PDF content   │  │      │  │ 1. Scan social channels    │  │
│  │ 2. Extract key claims  │  │      │  │ 2. Track Series A+ startups│  │
│  │ 3. Generate summary    │  │      │  │ 3. Extract pain points     │  │
│  │ 4. Create diagrams     │  │      │  │ 4. Cluster problems        │  │
│  │ 5. Generate embeddings │  │      │  │ 5. Score severity          │  │
│  └────────────────────────┘  │      │  └────────────────────────────┘  │
└──────────────┬───────────────┘      └─────────────┬────────────────────┘
               │                                    │
               ▼                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           CONVEX DATABASE                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Papers    │  │  Insights   │  │  Startups    │  │   Problems     │  │
│  │ + Content   │  │ + Embeddings│  │ + Funding    │  │  + Evidence    │  │
│  └─────────────┘  └─────────────┘  └──────────────┘  └────────────────┘  │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               ▼
              ┌──────────────────────────────────┐
              │ RESEARCH LINKING AGENT (Agent 3) │
              │  ┌────────────────────────────┐  │
              │  │ 1. Match problems→research │  │
              │  │ 2. Score relevance         │  │
              │  │ 3. Generate roadmaps       │  │
              │  │ 4. Synthesize solutions    │  │
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
  // PAPERS & CONTENT
  papers: defineTable({
    arxivId: v.string(),
    title: v.string(),
    authors: v.array(v.object({
      name: v.string(),
      affiliations: v.optional(v.array(v.string())),
    })),
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
      filterFields: ["primaryCategory", "processingStatus"]
    }),

  paperContent: defineTable({
    paperId: v.id("papers"),
    sections: v.array(v.object({
      type: v.string(),
      title: v.string(),
      content: v.string(),
      pageNumbers: v.array(v.number()),
    })),
    figures: v.array(v.object({
      figureNumber: v.string(),
      caption: v.string(),
      imageStorageId: v.id("_storage"),
      pageNumber: v.number(),
    })),
    tables: v.array(v.object({
      tableNumber: v.string(),
      caption: v.string(),
      headers: v.array(v.string()),
      rows: v.array(v.array(v.string())),
      pageNumber: v.number(),
    })),
    equations: v.array(v.object({
      latex: v.string(),
      context: v.string(),
      equationNumber: v.optional(v.string()),
    })),
    references: v.array(v.object({
      referenceNumber: v.number(),
      rawText: v.string(),
      parsedTitle: v.optional(v.string()),
      arxivId: v.optional(v.string()),
    })),
    processingTimestamp: v.number(),
  })
    .index("by_paper", ["paperId"]),

  // INSIGHTS
  insights: defineTable({
    paperId: v.id("papers"),
    problemStatement: v.string(),
    proposedSolution: v.string(),
    technicalApproach: v.string(),
    mainResults: v.string(),
    contributions: v.array(v.object({
      rank: v.number(),
      contribution: v.string(),
      noveltyScore: v.number(),
      evidenceStrength: v.number(),
    })),
    statedLimitations: v.array(v.string()),
    inferredWeaknesses: v.array(v.string()),
    reproducibilityScore: v.number(),
    industryApplications: v.array(v.object({
      industry: v.string(),
      application: v.string(),
      feasibility: v.string(),
    })),
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
      filterFields: ["technologyReadinessLevel"]
    }),

  // DIAGRAMS
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

  // TRENDS
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
    timeSeries: v.array(v.object({
      date: v.string(),
      paperCount: v.number(),
    })),
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

  // STARTUPS (Tracked Series A+ Companies)
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
    employeeCount: v.optional(v.object({
      min: v.number(),
      max: v.number(),
    })),
    industries: v.array(v.string()),
    headquarters: v.optional(v.string()),
    founders: v.array(v.object({
      name: v.string(),
      linkedinUrl: v.optional(v.string()),
      twitterHandle: v.optional(v.string()),
    })),
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
      filterFields: ["fundingStage", "isTracked"]
    }),

  // STARTUP PROBLEMS (Discovered Pain Points)
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
    evidence: v.array(v.object({
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
      engagement: v.optional(v.object({
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        shares: v.optional(v.number()),
      })),
      isImplicit: v.optional(v.boolean()),
      implicitSignalType: v.optional(v.string()),
    })),
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
      filterFields: ["status", "category.primary"]
    }),

  // FOUNDER NETWORK (For Network Intelligence)
  founders: defineTable({
    name: v.string(),
    twitterHandle: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    currentStartupId: v.optional(v.id("startups")),
    previousStartups: v.array(v.object({
      name: v.string(),
      outcome: v.optional(v.string()),
    })),
    credibilityScore: v.number(),
    followerCount: v.optional(v.number()),
    isActiveSharer: v.boolean(),
    topics: v.array(v.string()),
    lastActivityAt: v.number(),
  })
    .index("by_twitter", ["twitterHandle"])
    .index("by_credibility", ["credibilityScore"]),

  // IMPLICIT SIGNALS (For Implicit Problem Detection)
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

  // RESEARCH-PROBLEM LINKS
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
    implementationRoadmap: v.optional(v.object({
      phases: v.array(v.object({
        name: v.string(),
        duration: v.string(),
        description: v.string(),
      })),
      estimatedEffort: v.string(),
      estimatedImpact: v.string(),
    })),
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

  // SOLUTION SYNTHESIS REPORTS
  solutionReports: defineTable({
    problemId: v.id("startupProblems"),
    linkedResearch: v.array(v.id("researchLinks")),
    title: v.string(),
    executiveSummary: v.string(),
    problemAnalysis: v.object({
      statement: v.string(),
      affectedStartups: v.number(),
      severity: v.number(),
      currentSolutions: v.array(v.object({
        name: v.string(),
        limitations: v.array(v.string()),
      })),
    }),
    researchSynthesis: v.object({
      keyFindings: v.array(v.string()),
      combinedApproach: v.string(),
      novelContributions: v.array(v.string()),
    }),
    implementationPlan: v.object({
      recommendedApproach: v.string(),
      phases: v.array(v.object({
        phase: v.number(),
        name: v.string(),
        duration: v.string(),
        description: v.string(),
        researchUsed: v.array(v.id("papers")),
      })),
      estimatedImpact: v.string(),
      complexity: v.string(),
      risks: v.array(v.string()),
    }),
    generatedAt: v.number(),
    modelVersion: v.string(),
  })
    .index("by_problem", ["problemId"]),

  // USER DATA
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
  })
    .index("by_clerk_id", ["clerkId"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    itemType: v.string(),
    itemId: v.string(),
    notes: v.optional(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // AGENT MANAGEMENT
  agentRuns: defineTable({
    agentType: v.string(),
    status: v.string(),
    triggeredBy: v.string(),
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
    .index("by_status", ["status"]),
});
```

---

### Section 6: Technical Specifications

#### 6.1 Technology Stack Details

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Frontend** | Next.js | 14.x | React framework with App Router |
| **UI Library** | shadcn/ui | Latest | Accessible component library |
| **Styling** | TailwindCSS | 3.x | Utility-first CSS |
| **Database** | Convex | Latest | Real-time serverless database |
| **Auth** | Clerk | Latest | Authentication provider |
| **LLM** | Anthropic Claude | claude-3-opus | Primary analysis model |
| **Embeddings** | OpenAI | text-embedding-3-small | Vector embeddings |
| **PDF Processing** | PyMuPDF | 1.23.x | PDF text/image extraction |
| **Diagrams** | Mermaid.js | 10.x | Diagram rendering |
| **Charts** | Recharts | 2.x | Data visualization |
| **Graphs** | D3.js | 7.x | Complex visualizations |

#### 6.2 API Rate Limits & Quotas

| Service | Limit | Handling Strategy |
|---------|-------|-------------------|
| arXiv API | 1 request/3 seconds | Queue with delay, batch fetching |
| Anthropic API | 4M tokens/min | Token budgeting, caching |
| OpenAI Embeddings | 3000 RPM | Batch embedding requests |
| **Exa.ai API** | 1000 requests/month (Starter), 10K+ (Growth) | Query optimization, result caching, batch similar queries |
| Tavily API | 1000 requests/month (Free), unlimited (Pro) | Fallback only, caching |
| Perplexity API | Rate limited by plan | Real-time queries only |
| Crunchbase API | 200 requests/min | Batch fetching, daily sync |

**Cost Optimization for Exa:**
- Cache search results for 24 hours (problems don't change that fast)
- Batch similar queries into single semantic searches
- Use `findSimilar` for related content instead of new searches
- Schedule non-urgent discovery during off-peak hours

---

### Section 10: Security & Compliance

#### 10.1 Security Requirements

| Requirement | Implementation | Priority |
|-------------|----------------|----------|
| Authentication | Clerk OAuth 2.0 with MFA option | P0 |
| Authorization | Convex row-level security | P0 |
| Data Encryption | TLS 1.3 in transit, AES-256 at rest | P0 |
| API Key Management | Environment variables, secret rotation | P0 |
| Audit Logging | All agent runs and data access logged | P1 |
| Input Validation | Convex validators on all endpoints | P0 |

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
- Scheduled jobs (crons)
- Vector search

#### 12.2 Environment Configuration

```bash
# .env.local (Frontend)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Convex Dashboard Environment Variables
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
CLERK_WEBHOOK_SECRET=whsec_...
```

---

### Appendix C: Base File Structure

```
arxiv-research-platform/
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
│   │   └── settings/             # User settings
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── papers/                   # Paper components
│   ├── insights/                 # Insight components
│   ├── trends/                   # Trend components
│   ├── problems/                 # Problem components
│   ├── startups/                 # Startup components
│   ├── links/                    # Research link components
│   └── diagrams/                 # Diagram renderers
├── convex/                       # Convex backend
│   ├── schema.ts                 # Database schema
│   ├── papers.ts                 # Paper functions
│   ├── insights.ts               # Insight functions
│   ├── trends.ts                 # Trend functions
│   ├── startups.ts               # Startup functions
│   ├── problems.ts               # Problem functions
│   ├── researchLinks.ts          # Research link functions
│   ├── solutionReports.ts        # Solution report functions
│   ├── agents/                   # Agent actions
│   │   ├── research.ts           # Research Discovery Agent
│   │   ├── problemDiscovery.ts   # Problem Discovery Agent
│   │   └── researchLinking.ts    # Research Linking Agent
│   └── crons.ts                  # Scheduled jobs
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

### Week 3-4: Database & Auth
- [ ] Initialize Convex project
- [ ] Implement complete schema (all tables)
- [ ] Set up Clerk authentication
- [ ] Configure Convex-Clerk integration
- [ ] Implement row-level security

### Week 5-6: Deployment & Integration
- [ ] Deploy to Vercel
- [ ] Deploy Convex to production
- [ ] Configure environment variables
- [ ] Set up CI/CD pipeline
- [ ] Verify all integrations working

---

## Verification Criteria

- [ ] Next.js 14 app runs locally without errors
- [ ] All Convex tables created with correct indexes
- [ ] Clerk authentication flow works end-to-end
- [ ] shadcn/ui components render correctly
- [ ] Deployment to Vercel successful
- [ ] Convex Cloud deployment successful
- [ ] Environment variables configured in all environments
