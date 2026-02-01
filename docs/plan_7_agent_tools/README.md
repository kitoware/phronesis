# Plan 7: Agent Tools - Shared Tool Registry

## Overview

This plan implements a **shared tool registry** that provides reusable tools for all LangGraph agents. Instead of each agent implementing its own data access, search, and LLM integrations, they share a common toolset that ensures consistency, proper error handling, and centralized rate limiting.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TOOL REGISTRY                                    │
│                     src/agents/tools/index.ts                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Data Tools  │  │ Search Tools │  │  LLM Tools   │  │ PDF Tools   │  │
│  │              │  │              │  │              │  │             │  │
│  │ • papers     │  │ • exa        │  │ • chat       │  │ • download  │  │
│  │ • insights   │  │ • arxiv      │  │ • structured │  │ • extract   │  │
│  │ • problems   │  │ • crunchbase │  │ • streaming  │  │ • figures   │  │
│  │ • startups   │  │ • tavily     │  │ • embed      │  │ • tables    │  │
│  │ • links      │  │              │  │              │  │             │  │
│  │ • tasks      │  │              │  │              │  │             │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐                                     │
│  │Embedding Tool│  │ Cache Tools  │                                     │
│  │              │  │              │                                     │
│  │ • generate   │  │ • get        │                                     │
│  │ • batch      │  │ • set        │                                     │
│  │ • similarity │  │ • invalidate │                                     │
│  └──────────────┘  └──────────────┘                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐         ┌──────────┐         ┌──────────┐
   │ Research │         │ Problem  │         │  Trend   │
   │ Discovery│         │ Discovery│         │ Analysis │
   │   Agent  │         │   Agent  │         │   Agent  │
   └──────────┘         └──────────┘         └──────────┘
         │                    │
         ▼                    ▼
   ┌──────────┐         ┌──────────┐
   │ Insight  │         │ Research │
   │Generation│         │ Linking  │
   │   Agent  │         │   Agent  │
   └──────────┘         └──────────┘
```

## Directory Structure

```
src/agents/tools/
├── index.ts              # Main tool registry export
├── types.ts              # Shared type definitions
├── data/
│   ├── index.ts          # Data tools export
│   ├── papers.ts         # Paper CRUD operations
│   ├── insights.ts       # Insight CRUD operations
│   ├── problems.ts       # Problem CRUD operations
│   ├── startups.ts       # Startup CRUD operations
│   ├── links.ts          # Research link operations
│   ├── reports.ts        # Solution report operations
│   ├── trends.ts         # Trend data operations
│   ├── tasks.ts          # Agent task management
│   ├── checkpoints.ts    # LangGraph state persistence
│   └── approvals.ts      # Human-in-the-loop approvals
├── search/
│   ├── index.ts          # Search tools export
│   ├── exa.ts            # Exa.ai semantic search
│   ├── arxiv.ts          # arXiv API integration
│   ├── crunchbase.ts     # Crunchbase startup search (RapidAPI)
│   ├── youtube.ts        # YouTube transcript extraction
│   └── tavily.ts         # Tavily fallback search
├── llm/
│   ├── index.ts          # LLM tools export
│   ├── openrouter.ts     # OpenRouter client setup
│   ├── chat.ts           # Chat completion tool
│   ├── structured.ts     # Structured output tool
│   └── streaming.ts      # Streaming response tool
├── pdf/
│   ├── index.ts          # PDF tools export
│   ├── download.ts       # PDF download utility
│   ├── extract-text.ts   # Text extraction
│   ├── extract-figures.ts # Figure extraction
│   ├── extract-tables.ts  # Table extraction
│   └── extract-refs.ts    # Reference extraction
├── embedding/
│   ├── index.ts          # Embedding tools export
│   ├── generate.ts       # Single embedding generation
│   ├── batch.ts          # Batch embedding generation
│   └── similarity.ts     # Cosine similarity calculation
└── cache/
    ├── index.ts          # Cache tools export
    ├── memory.ts         # In-memory cache
    └── convex.ts         # Convex-based persistent cache
```

## Technology Stack

| Component      | Technology              | Purpose                               |
| -------------- | ----------------------- | ------------------------------------- |
| Tool Framework | `@langchain/core/tools` | LangGraph tool definition             |
| LLM Provider   | OpenRouter              | Unified access to Claude, GPT-4, etc. |
| Data Layer     | Convex                  | Real-time database operations         |
| Validation     | Zod                     | Runtime type validation               |
| HTTP Client    | Native fetch            | API requests                          |
| PDF Processing | PyMuPDF (Python)        | PDF text/figure extraction            |
| Embeddings     | OpenRouter              | text-embedding-3-small model          |

---

## 1. Tool Registry

### Main Registry Export

```typescript
// src/agents/tools/index.ts
import { dataTools } from "./data";
import { searchTools } from "./search";
import { llmTools } from "./llm";
import { pdfTools } from "./pdf";
import { embeddingTools } from "./embedding";
import { cacheTools } from "./cache";

/**
 * Complete tool registry for all LangGraph agents.
 * Import individual tool categories as needed.
 */
export const tools = {
  data: dataTools,
  search: searchTools,
  llm: llmTools,
  pdf: pdfTools,
  embedding: embeddingTools,
  cache: cacheTools,
};

// Re-export individual categories for selective imports
export { dataTools } from "./data";
export { searchTools } from "./search";
export { llmTools } from "./llm";
export { pdfTools } from "./pdf";
export { embeddingTools } from "./embedding";
export { cacheTools } from "./cache";

// Re-export all tool instances for LangGraph binding
export function getAllTools() {
  return [
    ...Object.values(dataTools),
    ...Object.values(searchTools),
    ...Object.values(llmTools),
    ...Object.values(pdfTools),
    ...Object.values(embeddingTools),
    ...Object.values(cacheTools),
  ];
}

// Get tools by category for specific agents
export function getToolsByCategory(categories: string[]) {
  const selectedTools: any[] = [];

  if (categories.includes("data")) {
    selectedTools.push(...Object.values(dataTools));
  }
  if (categories.includes("search")) {
    selectedTools.push(...Object.values(searchTools));
  }
  if (categories.includes("llm")) {
    selectedTools.push(...Object.values(llmTools));
  }
  if (categories.includes("pdf")) {
    selectedTools.push(...Object.values(pdfTools));
  }
  if (categories.includes("embedding")) {
    selectedTools.push(...Object.values(embeddingTools));
  }
  if (categories.includes("cache")) {
    selectedTools.push(...Object.values(cacheTools));
  }

  return selectedTools;
}
```

### Shared Types

```typescript
// src/agents/tools/types.ts
import { z } from "zod";

// ============================================================
// Common Response Types
// ============================================================

export interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    duration: number;
    cached: boolean;
    retries: number;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================
// Paper Types
// ============================================================

export const PaperSchema = z.object({
  arxivId: z.string(),
  title: z.string(),
  abstract: z.string(),
  authors: z.array(z.string()),
  categories: z.array(z.string()),
  primaryCategory: z.string(),
  publishedAt: z.number(),
  pdfUrl: z.string().url(),
  sourceUrl: z.string().url(),
});

export type Paper = z.infer<typeof PaperSchema>;

export const InsightSchema = z.object({
  paperId: z.string(),
  keyFindings: z.array(z.string()),
  methodology: z.string(),
  practicalApplications: z.array(z.string()),
  limitations: z.array(z.string()),
  futureDirections: z.array(z.string()),
  technicalComplexity: z.enum(["low", "medium", "high"]),
  implementationReadiness: z.enum([
    "theoretical",
    "experimental",
    "production-ready",
  ]),
  embedding: z.array(z.number()).optional(),
});

export type Insight = z.infer<typeof InsightSchema>;

// ============================================================
// Problem Types
// ============================================================

export const ProblemSchema = z.object({
  title: z.string(),
  description: z.string(),
  source: z.enum([
    "twitter",
    "reddit",
    "hackernews",
    "linkedin",
    "producthunt",
    "manual",
  ]),
  sourceUrl: z.string().url().optional(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  frequency: z.number().min(0).max(1),
  domain: z.string(),
  keywords: z.array(z.string()),
  startupId: z.string().optional(),
  embedding: z.array(z.number()).optional(),
});

export type Problem = z.infer<typeof ProblemSchema>;

export const ImplicitSignalSchema = z.object({
  signalType: z.enum([
    "hiring_pattern",
    "funding_focus",
    "pivot_indicator",
    "tech_stack_change",
    "market_expansion",
    "partnership_signal",
  ]),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  inferredProblem: z.string(),
  startupId: z.string(),
});

export type ImplicitSignal = z.infer<typeof ImplicitSignalSchema>;

// ============================================================
// Startup Types
// ============================================================

export const StartupSchema = z.object({
  name: z.string(),
  description: z.string(),
  website: z.string().url().optional(),
  crunchbaseUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  fundingStage: z.enum([
    "seed",
    "series_a",
    "series_b",
    "series_c",
    "series_d_plus",
  ]),
  fundingAmount: z.number().optional(),
  industry: z.string(),
  subIndustry: z.string().optional(),
  foundedYear: z.number().optional(),
  employeeCount: z.string().optional(),
  headquarters: z.string().optional(),
  tags: z.array(z.string()),
});

export type Startup = z.infer<typeof StartupSchema>;

// ============================================================
// Research Link Types
// ============================================================

export const ResearchLinkSchema = z.object({
  problemId: z.string(),
  insightId: z.string(),
  relevanceScore: z.number().min(0).max(1),
  implementationScore: z.number().min(0).max(1),
  noveltyScore: z.number().min(0).max(1),
  timelineScore: z.number().min(0).max(1),
  resourceScore: z.number().min(0).max(1),
  overallScore: z.number().min(0).max(1),
  matchExplanation: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
});

export type ResearchLink = z.infer<typeof ResearchLinkSchema>;

// ============================================================
// Trend Types
// ============================================================

export const TrendSchema = z.object({
  category: z.string(),
  period: z.enum(["daily", "weekly", "monthly"]),
  startDate: z.number(),
  endDate: z.number(),
  paperCount: z.number(),
  topKeywords: z.array(
    z.object({
      term: z.string(),
      count: z.number(),
      growth: z.number(),
    })
  ),
  emergingTopics: z.array(z.string()),
  status: z.enum([
    "emerging",
    "growing",
    "stable",
    "declining",
    "breakthrough",
  ]),
  growthRate: z.number(),
  momentum: z.number(),
  forecast: z
    .object({
      predictedGrowth: z.number(),
      confidence: z.number(),
      factors: z.array(z.string()),
    })
    .optional(),
});

export type Trend = z.infer<typeof TrendSchema>;

// ============================================================
// Agent Task Types
// ============================================================

export const AgentTaskSchema = z.object({
  taskId: z.string(),
  agentType: z.enum([
    "research_discovery",
    "problem_discovery",
    "research_linking",
    "insight_generation",
    "trend_analysis",
  ]),
  status: z.enum([
    "pending",
    "running",
    "completed",
    "failed",
    "awaiting_approval",
  ]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  payload: z.any(),
  result: z.any().optional(),
  error: z.string().optional(),
  threadId: z.string().optional(),
  createdAt: z.number(),
  completedAt: z.number().optional(),
});

export type AgentTask = z.infer<typeof AgentTaskSchema>;

// ============================================================
// Search Result Types
// ============================================================

export const SearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  content: z.string(),
  score: z.number().optional(),
  publishedDate: z.string().optional(),
  author: z.string().optional(),
  source: z.string(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;
```

---

## 2. Data Tools

### Papers Tool

```typescript
// src/agents/tools/data/papers.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { ToolResult, Paper, PaginatedResult } from "../types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ============================================================
// Create Paper Tool
// ============================================================

export const createPaperTool = tool(
  async (input): Promise<ToolResult<{ id: string }>> => {
    const startTime = Date.now();

    try {
      const id = await convex.mutation(api.papers.create, {
        arxivId: input.arxivId,
        title: input.title,
        abstract: input.abstract,
        authors: input.authors,
        categories: input.categories,
        primaryCategory: input.primaryCategory,
        publishedAt: input.publishedAt,
        pdfUrl: input.pdfUrl,
        sourceUrl: input.sourceUrl,
        status: "pending",
      });

      return {
        success: true,
        data: { id },
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create paper",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "create_paper",
    description: "Create a new paper record in the database",
    schema: z.object({
      arxivId: z.string().describe("The arXiv identifier (e.g., '2401.12345')"),
      title: z.string().describe("Paper title"),
      abstract: z.string().describe("Paper abstract"),
      authors: z.array(z.string()).describe("List of author names"),
      categories: z.array(z.string()).describe("arXiv categories"),
      primaryCategory: z.string().describe("Primary arXiv category"),
      publishedAt: z.number().describe("Publication timestamp"),
      pdfUrl: z.string().describe("URL to the PDF"),
      sourceUrl: z.string().describe("URL to the arXiv page"),
    }),
  }
);

// ============================================================
// Get Paper Tool
// ============================================================

export const getPaperTool = tool(
  async (input): Promise<ToolResult<Paper | null>> => {
    const startTime = Date.now();

    try {
      const paper = await convex.query(api.papers.getByArxivId, {
        arxivId: input.arxivId,
      });

      return {
        success: true,
        data: paper,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get paper",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "get_paper",
    description: "Get a paper by its arXiv ID",
    schema: z.object({
      arxivId: z.string().describe("The arXiv identifier to look up"),
    }),
  }
);

// ============================================================
// List Papers Tool
// ============================================================

export const listPapersTool = tool(
  async (input): Promise<ToolResult<PaginatedResult<Paper>>> => {
    const startTime = Date.now();

    try {
      const result = await convex.query(api.papers.list, {
        category: input.category,
        status: input.status,
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 20,
      });

      return {
        success: true,
        data: result,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list papers",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "list_papers",
    description: "List papers with optional filtering by category and status",
    schema: z.object({
      category: z.string().optional().describe("Filter by primary category"),
      status: z
        .enum(["pending", "processing", "processed", "failed"])
        .optional()
        .describe("Filter by processing status"),
      page: z.number().optional().describe("Page number (default: 1)"),
      pageSize: z.number().optional().describe("Items per page (default: 20)"),
    }),
  }
);

// ============================================================
// Update Paper Status Tool
// ============================================================

export const updatePaperStatusTool = tool(
  async (input): Promise<ToolResult<void>> => {
    const startTime = Date.now();

    try {
      await convex.mutation(api.papers.updateStatus, {
        paperId: input.paperId,
        status: input.status,
        error: input.error,
      });

      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update paper status",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "update_paper_status",
    description: "Update the processing status of a paper",
    schema: z.object({
      paperId: z.string().describe("The paper ID to update"),
      status: z
        .enum(["pending", "processing", "processed", "failed"])
        .describe("New status"),
      error: z
        .string()
        .optional()
        .describe("Error message if status is 'failed'"),
    }),
  }
);

// Export all paper tools
export const paperTools = {
  createPaper: createPaperTool,
  getPaper: getPaperTool,
  listPapers: listPapersTool,
  updatePaperStatus: updatePaperStatusTool,
};
```

### Agent Tasks Tool

```typescript
// src/agents/tools/data/tasks.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import type { ToolResult, AgentTask } from "../types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ============================================================
// Create Agent Task Tool
// ============================================================

export const createAgentTaskTool = tool(
  async (input): Promise<ToolResult<{ taskId: string }>> => {
    const startTime = Date.now();
    const taskId = uuidv4();

    try {
      await convex.mutation(api.agentTasks.create, {
        taskId,
        agentType: input.agentType,
        status: "pending",
        priority: input.priority ?? "medium",
        payload: input.payload,
        createdAt: Date.now(),
      });

      return {
        success: true,
        data: { taskId },
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create task",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "create_agent_task",
    description: "Create a new agent task in the queue",
    schema: z.object({
      agentType: z
        .enum([
          "research_discovery",
          "problem_discovery",
          "research_linking",
          "insight_generation",
          "trend_analysis",
        ])
        .describe("Type of agent to execute the task"),
      priority: z
        .enum(["critical", "high", "medium", "low"])
        .optional()
        .describe("Task priority (default: medium)"),
      payload: z.any().describe("Task-specific payload data"),
    }),
  }
);

// ============================================================
// Get Next Task Tool
// ============================================================

export const getNextTaskTool = tool(
  async (input): Promise<ToolResult<AgentTask | null>> => {
    const startTime = Date.now();

    try {
      const task = await convex.query(api.agentTasks.getNextPending, {
        agentType: input.agentType,
      });

      return {
        success: true,
        data: task,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get next task",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "get_next_agent_task",
    description: "Get the next pending task for an agent type",
    schema: z.object({
      agentType: z
        .enum([
          "research_discovery",
          "problem_discovery",
          "research_linking",
          "insight_generation",
          "trend_analysis",
        ])
        .optional()
        .describe("Filter by agent type"),
    }),
  }
);

// ============================================================
// Update Task Status Tool
// ============================================================

export const updateTaskStatusTool = tool(
  async (input): Promise<ToolResult<void>> => {
    const startTime = Date.now();

    try {
      await convex.mutation(api.agentTasks.updateStatus, {
        taskId: input.taskId,
        status: input.status,
        result: input.result,
        error: input.error,
        threadId: input.threadId,
        completedAt:
          input.status === "completed" || input.status === "failed"
            ? Date.now()
            : undefined,
      });

      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update task status",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "update_agent_task_status",
    description: "Update the status of an agent task",
    schema: z.object({
      taskId: z.string().describe("The task ID to update"),
      status: z
        .enum([
          "pending",
          "running",
          "completed",
          "failed",
          "awaiting_approval",
        ])
        .describe("New task status"),
      result: z.any().optional().describe("Task result if completed"),
      error: z.string().optional().describe("Error message if failed"),
      threadId: z.string().optional().describe("LangGraph thread ID"),
    }),
  }
);

// Export all task tools
export const taskTools = {
  createAgentTask: createAgentTaskTool,
  getNextTask: getNextTaskTool,
  updateTaskStatus: updateTaskStatusTool,
};
```

### Checkpoints Tool

```typescript
// src/agents/tools/data/checkpoints.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { ToolResult } from "../types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ============================================================
// Save Checkpoint Tool
// ============================================================

export const saveCheckpointTool = tool(
  async (input): Promise<ToolResult<void>> => {
    const startTime = Date.now();

    try {
      await convex.mutation(api.agentCheckpoints.save, {
        threadId: input.threadId,
        data: JSON.stringify(input.state),
        metadata: {
          source: input.source,
          step: input.step,
          writes: input.writes,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save checkpoint",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "save_checkpoint",
    description: "Save a LangGraph state checkpoint",
    schema: z.object({
      threadId: z.string().describe("The thread ID for this checkpoint"),
      state: z.any().describe("The serializable state to save"),
      source: z.string().describe("Source node that created this checkpoint"),
      step: z.number().describe("Step number in the graph execution"),
      writes: z.any().optional().describe("State writes in this step"),
    }),
  }
);

// ============================================================
// Load Checkpoint Tool
// ============================================================

export const loadCheckpointTool = tool(
  async (input): Promise<ToolResult<any>> => {
    const startTime = Date.now();

    try {
      const checkpoint = await convex.query(api.agentCheckpoints.getByThread, {
        threadId: input.threadId,
      });

      if (!checkpoint) {
        return {
          success: true,
          data: null,
          metadata: {
            duration: Date.now() - startTime,
            cached: false,
            retries: 0,
          },
        };
      }

      return {
        success: true,
        data: {
          state: JSON.parse(checkpoint.data),
          metadata: checkpoint.metadata,
        },
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load checkpoint",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "load_checkpoint",
    description: "Load a LangGraph state checkpoint by thread ID",
    schema: z.object({
      threadId: z.string().describe("The thread ID to load"),
    }),
  }
);

// Export all checkpoint tools
export const checkpointTools = {
  saveCheckpoint: saveCheckpointTool,
  loadCheckpoint: loadCheckpointTool,
};
```

### Approvals Tool (Human-in-the-Loop)

```typescript
// src/agents/tools/data/approvals.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { v4 as uuidv4 } from "uuid";
import type { ToolResult } from "../types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ============================================================
// Request Approval Tool
// ============================================================

export const requestApprovalTool = tool(
  async (input): Promise<ToolResult<{ requestId: string }>> => {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      await convex.mutation(api.agentApprovals.create, {
        requestId,
        taskId: input.taskId,
        threadId: input.threadId,
        agentType: input.agentType,
        description: input.description,
        data: input.data,
        status: "pending",
        requestedAt: Date.now(),
      });

      return {
        success: true,
        data: { requestId },
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to request approval",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "request_approval",
    description: "Request human approval for an agent action",
    schema: z.object({
      taskId: z.string().describe("The parent task ID"),
      threadId: z.string().describe("The LangGraph thread ID"),
      agentType: z.string().describe("The agent type requesting approval"),
      description: z
        .string()
        .describe("Human-readable description of what needs approval"),
      data: z.any().describe("Data to present for approval decision"),
    }),
  }
);

// ============================================================
// Check Approval Status Tool
// ============================================================

export const checkApprovalTool = tool(
  async (
    input
  ): Promise<
    ToolResult<{
      status: "pending" | "approved" | "rejected";
      notes?: string;
    }>
  > => {
    const startTime = Date.now();

    try {
      const approval = await convex.query(api.agentApprovals.getByRequestId, {
        requestId: input.requestId,
      });

      if (!approval) {
        return {
          success: false,
          error: "Approval request not found",
          metadata: {
            duration: Date.now() - startTime,
            cached: false,
            retries: 0,
          },
        };
      }

      return {
        success: true,
        data: {
          status: approval.status,
          notes: approval.notes,
        },
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to check approval",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "check_approval",
    description: "Check the status of an approval request",
    schema: z.object({
      requestId: z.string().describe("The approval request ID"),
    }),
  }
);

// ============================================================
// List Pending Approvals Tool
// ============================================================

export const listPendingApprovalsTool = tool(
  async (input): Promise<ToolResult<any[]>> => {
    const startTime = Date.now();

    try {
      const approvals = await convex.query(api.agentApprovals.listPending, {
        agentType: input.agentType,
      });

      return {
        success: true,
        data: approvals,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list approvals",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "list_pending_approvals",
    description: "List all pending approval requests",
    schema: z.object({
      agentType: z.string().optional().describe("Filter by agent type"),
    }),
  }
);

// Export all approval tools
export const approvalTools = {
  requestApproval: requestApprovalTool,
  checkApproval: checkApprovalTool,
  listPendingApprovals: listPendingApprovalsTool,
};
```

### Data Tools Index

```typescript
// src/agents/tools/data/index.ts
import { paperTools } from "./papers";
import { taskTools } from "./tasks";
import { checkpointTools } from "./checkpoints";
import { approvalTools } from "./approvals";

// Import other data tools (similar pattern)
// import { insightTools } from "./insights";
// import { problemTools } from "./problems";
// import { startupTools } from "./startups";
// import { linkTools } from "./links";
// import { reportTools } from "./reports";
// import { trendTools } from "./trends";

export const dataTools = {
  // Paper operations
  ...paperTools,

  // Task management
  ...taskTools,

  // Checkpoint persistence
  ...checkpointTools,

  // Human-in-the-loop approvals
  ...approvalTools,

  // Additional data tools (implement following same pattern)
  // ...insightTools,
  // ...problemTools,
  // ...startupTools,
  // ...linkTools,
  // ...reportTools,
  // ...trendTools,
};

export { paperTools, taskTools, checkpointTools, approvalTools };
```

---

## 3. Search Tools

### Exa.ai Search Tool

```typescript
// src/agents/tools/search/exa.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult, SearchResult } from "../types";

const EXA_API_KEY = process.env.EXA_API_KEY!;
const EXA_BASE_URL = "https://api.exa.ai";

// ============================================================
// Semantic Search Tool
// ============================================================

export const exaSemanticSearchTool = tool(
  async (input): Promise<ToolResult<SearchResult[]>> => {
    const startTime = Date.now();

    try {
      const response = await fetch(`${EXA_BASE_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": EXA_API_KEY,
        },
        body: JSON.stringify({
          query: input.query,
          type: "neural",
          useAutoprompt: true,
          numResults: input.numResults ?? 10,
          includeDomains: input.domains,
          excludeDomains: input.excludeDomains,
          startPublishedDate: input.startDate,
          endPublishedDate: input.endDate,
          contents: {
            text: { maxCharacters: input.maxChars ?? 2000 },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Exa API error: ${response.status}`);
      }

      const data = await response.json();

      const results: SearchResult[] = data.results.map((r: any) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        content: r.text || "",
        score: r.score,
        publishedDate: r.publishedDate,
        author: r.author,
        source: "exa",
      }));

      return {
        success: true,
        data: results,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Exa search failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "exa_semantic_search",
    description: "Perform semantic search using Exa.ai neural search",
    schema: z.object({
      query: z.string().describe("Natural language search query"),
      numResults: z
        .number()
        .optional()
        .describe("Number of results (default: 10)"),
      domains: z
        .array(z.string())
        .optional()
        .describe("Only include results from these domains"),
      excludeDomains: z
        .array(z.string())
        .optional()
        .describe("Exclude results from these domains"),
      startDate: z
        .string()
        .optional()
        .describe("Filter results published after this date (YYYY-MM-DD)"),
      endDate: z
        .string()
        .optional()
        .describe("Filter results published before this date (YYYY-MM-DD)"),
      maxChars: z
        .number()
        .optional()
        .describe("Max characters to extract per result (default: 2000)"),
    }),
  }
);

// ============================================================
// Find Similar Tool
// ============================================================

export const exaFindSimilarTool = tool(
  async (input): Promise<ToolResult<SearchResult[]>> => {
    const startTime = Date.now();

    try {
      const response = await fetch(`${EXA_BASE_URL}/findSimilar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": EXA_API_KEY,
        },
        body: JSON.stringify({
          url: input.url,
          numResults: input.numResults ?? 10,
          includeDomains: input.domains,
          excludeSourceDomain: input.excludeSource ?? true,
          contents: {
            text: { maxCharacters: input.maxChars ?? 2000 },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Exa API error: ${response.status}`);
      }

      const data = await response.json();

      const results: SearchResult[] = data.results.map((r: any) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        content: r.text || "",
        score: r.score,
        publishedDate: r.publishedDate,
        author: r.author,
        source: "exa",
      }));

      return {
        success: true,
        data: results,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Exa findSimilar failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "exa_find_similar",
    description: "Find pages similar to a given URL using Exa.ai",
    schema: z.object({
      url: z.string().url().describe("URL to find similar pages for"),
      numResults: z
        .number()
        .optional()
        .describe("Number of results (default: 10)"),
      domains: z
        .array(z.string())
        .optional()
        .describe("Only include results from these domains"),
      excludeSource: z
        .boolean()
        .optional()
        .describe("Exclude the source domain (default: true)"),
      maxChars: z
        .number()
        .optional()
        .describe("Max characters to extract per result (default: 2000)"),
    }),
  }
);

// Export all Exa tools
export const exaTools = {
  exaSemanticSearch: exaSemanticSearchTool,
  exaFindSimilar: exaFindSimilarTool,
};
```

### arXiv Search Tool

```typescript
// src/agents/tools/search/arxiv.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult, Paper } from "../types";

const ARXIV_API_URL = "http://export.arxiv.org/api/query";

// ============================================================
// arXiv Search Tool
// ============================================================

export const arxivSearchTool = tool(
  async (input): Promise<ToolResult<Paper[]>> => {
    const startTime = Date.now();

    try {
      // Build search query
      let searchQuery = "";

      if (input.categories && input.categories.length > 0) {
        const catQuery = input.categories.map((c) => `cat:${c}`).join(" OR ");
        searchQuery += `(${catQuery})`;
      }

      if (input.keywords && input.keywords.length > 0) {
        const keywordQuery = input.keywords.map((k) => `all:${k}`).join(" OR ");
        searchQuery += searchQuery
          ? ` AND (${keywordQuery})`
          : `(${keywordQuery})`;
      }

      if (input.title) {
        searchQuery += searchQuery
          ? ` AND ti:${input.title}`
          : `ti:${input.title}`;
      }

      if (input.author) {
        searchQuery += searchQuery
          ? ` AND au:${input.author}`
          : `au:${input.author}`;
      }

      const params = new URLSearchParams({
        search_query: searchQuery || "all:*",
        start: String(input.start ?? 0),
        max_results: String(input.maxResults ?? 50),
        sortBy: input.sortBy ?? "submittedDate",
        sortOrder: "descending",
      });

      const response = await fetch(`${ARXIV_API_URL}?${params}`);

      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
      }

      const xml = await response.text();
      const papers = parseArxivXml(xml);

      return {
        success: true,
        data: papers,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "arXiv search failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "arxiv_search",
    description: "Search arXiv for academic papers",
    schema: z.object({
      categories: z
        .array(z.string())
        .optional()
        .describe("arXiv categories to search (e.g., cs.AI, cs.LG)"),
      keywords: z
        .array(z.string())
        .optional()
        .describe("Keywords to search for"),
      title: z.string().optional().describe("Search in paper titles"),
      author: z.string().optional().describe("Search by author name"),
      start: z
        .number()
        .optional()
        .describe("Starting index for pagination (default: 0)"),
      maxResults: z
        .number()
        .optional()
        .describe("Maximum results to return (default: 50)"),
      sortBy: z
        .enum(["relevance", "lastUpdatedDate", "submittedDate"])
        .optional()
        .describe("Sort order (default: submittedDate)"),
    }),
  }
);

// ============================================================
// arXiv Fetch by ID Tool
// ============================================================

export const arxivFetchByIdTool = tool(
  async (input): Promise<ToolResult<Paper | null>> => {
    const startTime = Date.now();

    try {
      const params = new URLSearchParams({
        id_list: input.arxivId,
      });

      const response = await fetch(`${ARXIV_API_URL}?${params}`);

      if (!response.ok) {
        throw new Error(`arXiv API error: ${response.status}`);
      }

      const xml = await response.text();
      const papers = parseArxivXml(xml);

      return {
        success: true,
        data: papers.length > 0 ? papers[0] : null,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "arXiv fetch failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "arxiv_fetch_by_id",
    description: "Fetch a specific paper from arXiv by ID",
    schema: z.object({
      arxivId: z.string().describe("The arXiv ID (e.g., '2401.12345')"),
    }),
  }
);

// Helper function to parse arXiv XML response
function parseArxivXml(xml: string): Paper[] {
  const papers: Paper[] = [];

  // Simple regex-based parsing (in production, use a proper XML parser)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const getId = (tag: string) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
      return m ? m[1].trim() : "";
    };

    const getAll = (tag: string) => {
      const matches: string[] = [];
      const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "g");
      let m;
      while ((m = regex.exec(entry)) !== null) {
        matches.push(m[1].trim());
      }
      return matches;
    };

    const id = getId("id");
    const arxivId = id.split("/abs/").pop()?.replace("v", "") || id;

    papers.push({
      arxivId,
      title: getId("title").replace(/\s+/g, " "),
      abstract: getId("summary").replace(/\s+/g, " "),
      authors: getAll("name"),
      categories: getAll("category").map((c) => {
        const m = c.match(/term="([^"]+)"/);
        return m ? m[1] : c;
      }),
      primaryCategory: (() => {
        const m = entry.match(/primary_category[^>]*term="([^"]+)"/);
        return m ? m[1] : "";
      })(),
      publishedAt: new Date(getId("published")).getTime(),
      pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
      sourceUrl: `https://arxiv.org/abs/${arxivId}`,
    });
  }

  return papers;
}

// Export all arXiv tools
export const arxivTools = {
  arxivSearch: arxivSearchTool,
  arxivFetchById: arxivFetchByIdTool,
};
```

### Tavily Search Tool (Fallback)

```typescript
// src/agents/tools/search/tavily.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult, SearchResult } from "../types";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY!;
const TAVILY_BASE_URL = "https://api.tavily.com";

// ============================================================
// Tavily Search Tool
// ============================================================

export const tavilySearchTool = tool(
  async (input): Promise<ToolResult<SearchResult[]>> => {
    const startTime = Date.now();

    try {
      const response = await fetch(`${TAVILY_BASE_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: input.query,
          search_depth: input.searchDepth ?? "basic",
          include_domains: input.domains,
          exclude_domains: input.excludeDomains,
          max_results: input.maxResults ?? 10,
          include_raw_content: false,
          include_answer: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`);
      }

      const data = await response.json();

      const results: SearchResult[] = data.results.map((r: any) => ({
        id: r.url,
        title: r.title,
        url: r.url,
        content: r.content || "",
        score: r.score,
        publishedDate: r.published_date,
        source: "tavily",
      }));

      return {
        success: true,
        data: results,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Tavily search failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "tavily_search",
    description: "Perform web search using Tavily (fallback search provider)",
    schema: z.object({
      query: z.string().describe("Search query"),
      searchDepth: z
        .enum(["basic", "advanced"])
        .optional()
        .describe("Search depth (default: basic)"),
      domains: z
        .array(z.string())
        .optional()
        .describe("Only include results from these domains"),
      excludeDomains: z
        .array(z.string())
        .optional()
        .describe("Exclude results from these domains"),
      maxResults: z
        .number()
        .optional()
        .describe("Maximum results to return (default: 10)"),
    }),
  }
);

// Export all Tavily tools
export const tavilyTools = {
  tavilySearch: tavilySearchTool,
};
```

### Crunchbase Search Tool (RapidAPI)

```typescript
// src/agents/tools/search/crunchbase.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult, Startup } from "../types";

// Using RapidAPI Crunchbase endpoint
// https://rapidapi.com/crunchbase-team1-crunchbase/api/crunchbase
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const CRUNCHBASE_BASE_URL = "https://crunchbase-crunchbase-v1.p.rapidapi.com";

// ============================================================
// Crunchbase Organization Search Tool
// ============================================================

export const crunchbaseSearchTool = tool(
  async (input): Promise<ToolResult<Startup[]>> => {
    const startTime = Date.now();

    try {
      const params = new URLSearchParams({
        query: input.query,
      });

      const response = await fetch(
        `${CRUNCHBASE_BASE_URL}/odm-organizations?${params}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": "crunchbase-crunchbase-v1.p.rapidapi.com",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Crunchbase API error: ${response.status}`);
      }

      const data = await response.json();

      const startups: Startup[] = data.entities
        .filter((entity: any) => {
          // Filter by funding stage if specified
          if (input.fundingStages && input.fundingStages.length > 0) {
            const lastFundingType = entity.properties?.last_funding_type;
            return input.fundingStages.some((stage) =>
              lastFundingType?.toLowerCase().includes(stage.toLowerCase())
            );
          }
          return true;
        })
        .slice(0, input.limit || 25)
        .map((entity: any) => ({
          name: entity.properties?.name || "",
          description: entity.properties?.short_description || "",
          website: entity.properties?.homepage_url,
          crunchbaseUrl: `https://www.crunchbase.com/organization/${entity.properties?.permalink}`,
          linkedinUrl: entity.properties?.linkedin?.value,
          fundingStage: mapFundingStage(entity.properties?.last_funding_type),
          fundingAmount: entity.properties?.funding_total?.value_usd,
          industry: entity.properties?.category_groups?.[0] || "Unknown",
          subIndustry: entity.properties?.categories?.[0],
          foundedYear: entity.properties?.founded_on
            ? new Date(entity.properties.founded_on).getFullYear()
            : undefined,
          employeeCount: entity.properties?.num_employees_enum,
          headquarters: formatLocation(entity.properties?.location_identifiers),
          tags: entity.properties?.categories || [],
        }));

      return {
        success: true,
        data: startups,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Crunchbase search failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "crunchbase_search",
    description:
      "Search for startups using Crunchbase API (via RapidAPI). Returns funding, industry, and company details.",
    schema: z.object({
      query: z.string().describe("Search query for company name or keywords"),
      fundingStages: z
        .array(
          z.enum(["seed", "series_a", "series_b", "series_c", "series_d_plus"])
        )
        .optional()
        .describe("Filter by funding stages"),
      limit: z
        .number()
        .optional()
        .describe("Maximum results to return (default: 25)"),
    }),
  }
);

// ============================================================
// Crunchbase Organization Details Tool
// ============================================================

export const crunchbaseGetDetailsTool = tool(
  async (input): Promise<ToolResult<any>> => {
    const startTime = Date.now();

    try {
      const response = await fetch(
        `${CRUNCHBASE_BASE_URL}/odm-organizations/${input.permalink}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": "crunchbase-crunchbase-v1.p.rapidapi.com",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Crunchbase API error: ${response.status}`);
      }

      const data = await response.json();
      const props = data.properties || {};

      return {
        success: true,
        data: {
          uuid: props.uuid,
          name: props.name,
          description: props.short_description,
          longDescription: props.description,
          website: props.homepage_url,
          linkedin: props.linkedin?.value,
          twitter: props.twitter?.value,
          facebook: props.facebook?.value,
          fundingTotal: props.funding_total?.value_usd,
          lastFundingType: props.last_funding_type,
          lastFundingAt: props.last_funding_at,
          numFundingRounds: props.num_funding_rounds,
          foundedOn: props.founded_on,
          closedOn: props.closed_on,
          numEmployees: props.num_employees_enum,
          stockExchange: props.stock_exchange,
          stockSymbol: props.stock_symbol,
          categories: props.categories || [],
          categoryGroups: props.category_groups || [],
          location: formatLocation(props.location_identifiers),
          founders: data.relationships?.founders?.items || [],
          investors: data.relationships?.investors?.items || [],
          fundingRounds: data.relationships?.funding_rounds?.items || [],
        },
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Crunchbase details fetch failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "crunchbase_get_details",
    description:
      "Get detailed information about a specific company from Crunchbase including founders, investors, and funding rounds.",
    schema: z.object({
      permalink: z
        .string()
        .describe(
          "The Crunchbase permalink/slug for the organization (e.g., 'openai')"
        ),
    }),
  }
);

// Helper functions
function mapFundingStage(
  fundingType: string | undefined
): Startup["fundingStage"] {
  if (!fundingType) return "seed";
  const type = fundingType.toLowerCase();
  if (
    type.includes("series_d") ||
    type.includes("series_e") ||
    type.includes("series_f")
  )
    return "series_d_plus";
  if (type.includes("series_c")) return "series_c";
  if (type.includes("series_b")) return "series_b";
  if (type.includes("series_a")) return "series_a";
  return "seed";
}

function formatLocation(locations: any[] | undefined): string {
  if (!locations?.length) return "Unknown";
  const loc = locations[0];
  return [loc?.value, loc?.location_type].filter(Boolean).join(", ");
}

// Export all Crunchbase tools
export const crunchbaseTools = {
  crunchbaseSearch: crunchbaseSearchTool,
  crunchbaseGetDetails: crunchbaseGetDetailsTool,
};
```

### YouTube Transcript Tool

```typescript
// src/agents/tools/search/youtube.ts
// Using @playzone/youtube-transcript package
// https://www.npmjs.com/package/@playzone/youtube-transcript
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { YoutubeTranscript } from "@playzone/youtube-transcript";
import type { ToolResult } from "../types";

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

interface TranscriptResult {
  videoId: string;
  title?: string;
  transcript: TranscriptSegment[];
  fullText: string;
  duration: number;
}

// ============================================================
// YouTube Transcript Fetch Tool
// ============================================================

export const youtubeTranscriptTool = tool(
  async (input): Promise<ToolResult<TranscriptResult>> => {
    const startTime = Date.now();

    try {
      // Extract video ID from URL or use directly
      const videoId = extractVideoId(input.videoUrl);
      if (!videoId) {
        throw new Error("Invalid YouTube URL or video ID");
      }

      // Fetch transcript using the library
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: input.language || "en",
      });

      // Transform to our format
      const transcript: TranscriptSegment[] = transcriptItems.map((item) => ({
        text: item.text,
        offset: item.offset,
        duration: item.duration,
      }));

      // Combine all text segments
      const fullText = transcript.map((t) => t.text).join(" ");

      // Calculate total duration
      const lastSegment = transcript[transcript.length - 1];
      const totalDuration = lastSegment
        ? lastSegment.offset + lastSegment.duration
        : 0;

      return {
        success: true,
        data: {
          videoId,
          transcript,
          fullText,
          duration: totalDuration,
        },
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "YouTube transcript fetch failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "youtube_transcript",
    description:
      "Fetch the transcript/captions from a YouTube video. Useful for analyzing founder interviews, startup talks, and pitch videos.",
    schema: z.object({
      videoUrl: z
        .string()
        .describe(
          "YouTube video URL or video ID (e.g., 'https://youtube.com/watch?v=xyz' or 'xyz')"
        ),
      language: z
        .string()
        .optional()
        .describe("Transcript language code (default: 'en')"),
    }),
  }
);

// ============================================================
// YouTube Search & Transcript Tool
// ============================================================

export const youtubeSearchTranscriptsTool = tool(
  async (input): Promise<ToolResult<TranscriptResult[]>> => {
    const startTime = Date.now();

    try {
      // Note: For production, consider using YouTube Data API for search
      // This tool assumes video URLs are provided directly
      const results: TranscriptResult[] = [];
      const errors: string[] = [];

      for (const url of input.videoUrls) {
        try {
          const videoId = extractVideoId(url);
          if (!videoId) continue;

          const transcriptItems = await YoutubeTranscript.fetchTranscript(
            videoId,
            { lang: input.language || "en" }
          );

          const transcript: TranscriptSegment[] = transcriptItems.map(
            (item) => ({
              text: item.text,
              offset: item.offset,
              duration: item.duration,
            })
          );

          const fullText = transcript.map((t) => t.text).join(" ");
          const lastSegment = transcript[transcript.length - 1];

          results.push({
            videoId,
            transcript,
            fullText,
            duration: lastSegment
              ? lastSegment.offset + lastSegment.duration
              : 0,
          });
        } catch (err) {
          errors.push(`Failed to fetch transcript for ${url}`);
        }
      }

      return {
        success: true,
        data: results,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "YouTube batch transcript fetch failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "youtube_batch_transcripts",
    description:
      "Fetch transcripts from multiple YouTube videos at once. Useful for batch processing founder interviews or conference talks.",
    schema: z.object({
      videoUrls: z
        .array(z.string())
        .describe("Array of YouTube video URLs or IDs"),
      language: z
        .string()
        .optional()
        .describe("Transcript language code (default: 'en')"),
    }),
  }
);

// Helper function to extract video ID from various YouTube URL formats
function extractVideoId(input: string): string | null {
  // If it's already just an ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // Try to extract from URL
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Export all YouTube tools
export const youtubeTools = {
  youtubeTranscript: youtubeTranscriptTool,
  youtubeBatchTranscripts: youtubeSearchTranscriptsTool,
};
```

### Search Tools Index

```typescript
// src/agents/tools/search/index.ts
import { exaTools } from "./exa";
import { arxivTools } from "./arxiv";
import { tavilyTools } from "./tavily";
import { crunchbaseTools } from "./crunchbase";
import { youtubeTools } from "./youtube";

export const searchTools = {
  ...exaTools,
  ...arxivTools,
  ...tavilyTools,
  ...crunchbaseTools,
  ...youtubeTools,
};

export { exaTools, arxivTools, tavilyTools, crunchbaseTools, youtubeTools };
```

---

## 4. LLM Tools

### OpenRouter Client Setup

```typescript
// src/agents/tools/llm/openrouter.ts
import { ChatOpenAI } from "@langchain/openai";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

/**
 * Create an OpenRouter-backed LLM client.
 * Available models:
 * - anthropic/claude-3.5-sonnet (default - best for coding)
 * - anthropic/claude-3-opus (complex reasoning)
 * - openai/gpt-4-turbo (alternative)
 * - meta-llama/llama-3-70b-instruct (cost-effective)
 */
export function createOpenRouterClient(
  modelName = "anthropic/claude-3.5-sonnet",
  options?: {
    temperature?: number;
    maxTokens?: number;
    streaming?: boolean;
  }
): ChatOpenAI {
  return new ChatOpenAI({
    modelName,
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? 4096,
    streaming: options?.streaming ?? false,
    openAIApiKey: OPENROUTER_API_KEY,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://phronesis.app",
        "X-Title": "Phronesis Research Platform",
      },
    },
  });
}

// Pre-configured clients for common use cases
export const llmClients = {
  // Default client for most tasks
  default: createOpenRouterClient(),

  // High-precision client for analysis
  analysis: createOpenRouterClient("anthropic/claude-3.5-sonnet", {
    temperature: 0.3,
    maxTokens: 8192,
  }),

  // Fast client for simple tasks
  fast: createOpenRouterClient("anthropic/claude-3-haiku", {
    temperature: 0.5,
    maxTokens: 2048,
  }),

  // Streaming client for real-time responses
  streaming: createOpenRouterClient("anthropic/claude-3.5-sonnet", {
    streaming: true,
  }),
};
```

### Chat Completion Tool

```typescript
// src/agents/tools/llm/chat.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createOpenRouterClient } from "./openrouter";
import type { ToolResult } from "../types";

// ============================================================
// Chat Completion Tool
// ============================================================

export const chatCompletionTool = tool(
  async (input): Promise<ToolResult<string>> => {
    const startTime = Date.now();

    try {
      const client = createOpenRouterClient(input.model, {
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      });

      const messages = [];

      if (input.systemPrompt) {
        messages.push(new SystemMessage(input.systemPrompt));
      }

      messages.push(new HumanMessage(input.prompt));

      const response = await client.invoke(messages);
      const content =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

      return {
        success: true,
        data: content,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Chat completion failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "chat_completion",
    description: "Generate a chat completion using OpenRouter",
    schema: z.object({
      prompt: z.string().describe("The user prompt/message"),
      systemPrompt: z
        .string()
        .optional()
        .describe("System prompt to set context"),
      model: z
        .string()
        .optional()
        .describe("Model to use (default: anthropic/claude-3.5-sonnet)"),
      temperature: z
        .number()
        .min(0)
        .max(2)
        .optional()
        .describe("Temperature for response randomness (default: 0.7)"),
      maxTokens: z
        .number()
        .optional()
        .describe("Maximum tokens in response (default: 4096)"),
    }),
  }
);

export const chatTools = {
  chatCompletion: chatCompletionTool,
};
```

### Structured Output Tool

```typescript
// src/agents/tools/llm/structured.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createOpenRouterClient } from "./openrouter";
import type { ToolResult } from "../types";

// Pre-defined output schemas for common use cases
const outputSchemas = {
  // Paper analysis schema
  paperAnalysis: z.object({
    keyFindings: z.array(z.string()),
    methodology: z.string(),
    practicalApplications: z.array(z.string()),
    limitations: z.array(z.string()),
    futureDirections: z.array(z.string()),
    technicalComplexity: z.enum(["low", "medium", "high"]),
    implementationReadiness: z.enum([
      "theoretical",
      "experimental",
      "production-ready",
    ]),
  }),

  // Problem extraction schema
  problemExtraction: z.object({
    problems: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        severity: z.enum(["critical", "high", "medium", "low"]),
        keywords: z.array(z.string()),
      })
    ),
  }),

  // Trend forecast schema
  trendForecast: z.object({
    predictedGrowth: z.number(),
    confidence: z.number().min(0).max(1),
    factors: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),

  // Match scoring schema
  matchScoring: z.object({
    relevanceScore: z.number().min(0).max(1),
    implementationScore: z.number().min(0).max(1),
    noveltyScore: z.number().min(0).max(1),
    timelineScore: z.number().min(0).max(1),
    resourceScore: z.number().min(0).max(1),
    explanation: z.string(),
  }),
};

// ============================================================
// Structured Output Tool
// ============================================================

export const structuredOutputTool = tool(
  async (input): Promise<ToolResult<any>> => {
    const startTime = Date.now();

    try {
      const client = createOpenRouterClient(input.model, {
        temperature: input.temperature ?? 0.3,
        maxTokens: input.maxTokens,
      });

      // Get the schema
      const schema = input.schemaName
        ? outputSchemas[input.schemaName as keyof typeof outputSchemas]
        : z.object(JSON.parse(input.customSchema || "{}"));

      if (!schema) {
        throw new Error(`Unknown schema: ${input.schemaName}`);
      }

      // Use withStructuredOutput for guaranteed schema compliance
      const structuredClient = client.withStructuredOutput(schema);

      const response = await structuredClient.invoke(input.prompt);

      return {
        success: true,
        data: response,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Structured output failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "structured_output",
    description: "Generate structured output with guaranteed schema compliance",
    schema: z.object({
      prompt: z.string().describe("The prompt to process"),
      schemaName: z
        .enum([
          "paperAnalysis",
          "problemExtraction",
          "trendForecast",
          "matchScoring",
        ])
        .optional()
        .describe("Pre-defined schema name"),
      customSchema: z
        .string()
        .optional()
        .describe(
          "Custom Zod schema as JSON string (if not using pre-defined)"
        ),
      model: z
        .string()
        .optional()
        .describe("Model to use (default: anthropic/claude-3.5-sonnet)"),
      temperature: z
        .number()
        .min(0)
        .max(2)
        .optional()
        .describe("Temperature (default: 0.3 for structured output)"),
      maxTokens: z.number().optional().describe("Maximum tokens in response"),
    }),
  }
);

export const structuredTools = {
  structuredOutput: structuredOutputTool,
};
```

### LLM Tools Index

```typescript
// src/agents/tools/llm/index.ts
import { chatTools } from "./chat";
import { structuredTools } from "./structured";
// import { streamingTools } from "./streaming";

export const llmTools = {
  ...chatTools,
  ...structuredTools,
  // ...streamingTools,
};

export { chatTools, structuredTools };
export { createOpenRouterClient, llmClients } from "./openrouter";
```

---

## 5. PDF Processing Tools

```typescript
// src/agents/tools/pdf/index.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import type { ToolResult } from "../types";

const TEMP_DIR = "/tmp/phronesis-pdf";

// ============================================================
// Download PDF Tool
// ============================================================

export const downloadPdfTool = tool(
  async (input): Promise<ToolResult<{ localPath: string }>> => {
    const startTime = Date.now();

    try {
      await fs.mkdir(TEMP_DIR, { recursive: true });

      const filename = input.arxivId
        ? `${input.arxivId}.pdf`
        : `${Date.now()}.pdf`;
      const localPath = path.join(TEMP_DIR, filename);

      const response = await fetch(input.pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      await fs.writeFile(localPath, Buffer.from(buffer));

      return {
        success: true,
        data: { localPath },
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "PDF download failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "download_pdf",
    description: "Download a PDF file from URL to local storage",
    schema: z.object({
      pdfUrl: z.string().url().describe("URL of the PDF to download"),
      arxivId: z.string().optional().describe("arXiv ID for naming the file"),
    }),
  }
);

// ============================================================
// Extract Text Tool
// ============================================================

export const extractTextTool = tool(
  async (input): Promise<ToolResult<{ text: string; pageCount: number }>> => {
    const startTime = Date.now();

    try {
      // Use PyMuPDF via Python subprocess
      const result = await runPythonScript(
        `
import fitz  # PyMuPDF
import json
import sys

pdf_path = sys.argv[1]
doc = fitz.open(pdf_path)

text = ""
for page in doc:
    text += page.get_text()

result = {
    "text": text,
    "pageCount": len(doc)
}

print(json.dumps(result))
      `,
        [input.localPath]
      );

      const parsed = JSON.parse(result);

      return {
        success: true,
        data: parsed,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Text extraction failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "extract_pdf_text",
    description: "Extract text content from a PDF file",
    schema: z.object({
      localPath: z.string().describe("Local path to the PDF file"),
    }),
  }
);

// ============================================================
// Extract Figures Tool
// ============================================================

export const extractFiguresTool = tool(
  async (input): Promise<ToolResult<{ figures: string[] }>> => {
    const startTime = Date.now();

    try {
      const outputDir = path.join(
        TEMP_DIR,
        "figures",
        path.basename(input.localPath, ".pdf")
      );
      await fs.mkdir(outputDir, { recursive: true });

      const result = await runPythonScript(
        `
import fitz
import json
import sys
import os

pdf_path = sys.argv[1]
output_dir = sys.argv[2]

doc = fitz.open(pdf_path)
figures = []

for page_num, page in enumerate(doc):
    images = page.get_images()
    for img_index, img in enumerate(images):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]

        filename = f"page{page_num + 1}_fig{img_index + 1}.{image_ext}"
        filepath = os.path.join(output_dir, filename)

        with open(filepath, "wb") as f:
            f.write(image_bytes)

        figures.append(filepath)

print(json.dumps({"figures": figures}))
      `,
        [input.localPath, outputDir]
      );

      const parsed = JSON.parse(result);

      return {
        success: true,
        data: parsed,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Figure extraction failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "extract_pdf_figures",
    description: "Extract figures/images from a PDF file",
    schema: z.object({
      localPath: z.string().describe("Local path to the PDF file"),
    }),
  }
);

// Helper to run Python scripts
async function runPythonScript(
  script: string,
  args: string[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn("python3", ["-c", script, ...args]);

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`Python script failed: ${stderr}`));
      }
    });
  });
}

export const pdfTools = {
  downloadPdf: downloadPdfTool,
  extractText: extractTextTool,
  extractFigures: extractFiguresTool,
};
```

---

## 6. Embedding Tools

```typescript
// src/agents/tools/embedding/index.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

// ============================================================
// Generate Embedding Tool
// ============================================================

export const generateEmbeddingTool = tool(
  async (input): Promise<ToolResult<{ embedding: number[] }>> => {
    const startTime = Date.now();

    try {
      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://phronesis.app",
          "X-Title": "Phronesis Research Platform",
        },
        body: JSON.stringify({
          model: input.model ?? "openai/text-embedding-3-small",
          input: input.text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: { embedding: data.data[0].embedding },
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Embedding generation failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "generate_embedding",
    description: "Generate an embedding vector for text",
    schema: z.object({
      text: z.string().describe("Text to generate embedding for"),
      model: z
        .string()
        .optional()
        .describe("Embedding model (default: openai/text-embedding-3-small)"),
    }),
  }
);

// ============================================================
// Batch Generate Embeddings Tool
// ============================================================

export const batchGenerateEmbeddingsTool = tool(
  async (input): Promise<ToolResult<{ embeddings: number[][] }>> => {
    const startTime = Date.now();

    try {
      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://phronesis.app",
          "X-Title": "Phronesis Research Platform",
        },
        body: JSON.stringify({
          model: input.model ?? "openai/text-embedding-3-small",
          input: input.texts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json();
      const embeddings = data.data.map((d: any) => d.embedding);

      return {
        success: true,
        data: { embeddings },
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Batch embedding failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "batch_generate_embeddings",
    description: "Generate embedding vectors for multiple texts",
    schema: z.object({
      texts: z
        .array(z.string())
        .describe("Array of texts to generate embeddings for"),
      model: z
        .string()
        .optional()
        .describe("Embedding model (default: openai/text-embedding-3-small)"),
    }),
  }
);

// ============================================================
// Cosine Similarity Tool
// ============================================================

export const cosineSimilarityTool = tool(
  async (input): Promise<ToolResult<{ similarity: number }>> => {
    const startTime = Date.now();

    try {
      const { embedding1, embedding2 } = input;

      if (embedding1.length !== embedding2.length) {
        throw new Error("Embeddings must have the same dimension");
      }

      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
      }

      const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

      return {
        success: true,
        data: { similarity },
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Similarity calculation failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "cosine_similarity",
    description: "Calculate cosine similarity between two embedding vectors",
    schema: z.object({
      embedding1: z.array(z.number()).describe("First embedding vector"),
      embedding2: z.array(z.number()).describe("Second embedding vector"),
    }),
  }
);

export const embeddingTools = {
  generateEmbedding: generateEmbeddingTool,
  batchGenerateEmbeddings: batchGenerateEmbeddingsTool,
  cosineSimilarity: cosineSimilarityTool,
};
```

---

## 7. Cache Tools

```typescript
// src/agents/tools/cache/index.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { ToolResult } from "../types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// In-memory cache for fast access
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

// ============================================================
// Get Cache Tool
// ============================================================

export const getCacheTool = tool(
  async (input): Promise<ToolResult<any>> => {
    const startTime = Date.now();

    try {
      // Check memory cache first
      const memEntry = memoryCache.get(input.key);
      if (memEntry && memEntry.expiresAt > Date.now()) {
        return {
          success: true,
          data: memEntry.value,
          metadata: {
            duration: Date.now() - startTime,
            cached: true,
            retries: 0,
          },
        };
      }

      // Fall back to Convex cache if persistent
      if (input.persistent) {
        const cached = await convex.query(api.cache.get, { key: input.key });

        if (cached && cached.expiresAt > Date.now()) {
          // Warm memory cache
          memoryCache.set(input.key, {
            value: cached.value,
            expiresAt: cached.expiresAt,
          });

          return {
            success: true,
            data: cached.value,
            metadata: {
              duration: Date.now() - startTime,
              cached: true,
              retries: 0,
            },
          };
        }
      }

      return {
        success: true,
        data: null,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Cache get failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "cache_get",
    description: "Get a value from cache",
    schema: z.object({
      key: z.string().describe("Cache key"),
      persistent: z
        .boolean()
        .optional()
        .describe("Also check persistent Convex cache (default: false)"),
    }),
  }
);

// ============================================================
// Set Cache Tool
// ============================================================

export const setCacheTool = tool(
  async (input): Promise<ToolResult<void>> => {
    const startTime = Date.now();

    try {
      const expiresAt = Date.now() + (input.ttlSeconds ?? 3600) * 1000;

      // Always set in memory cache
      memoryCache.set(input.key, {
        value: input.value,
        expiresAt,
      });

      // Optionally persist to Convex
      if (input.persistent) {
        await convex.mutation(api.cache.set, {
          key: input.key,
          value: input.value,
          expiresAt,
        });
      }

      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Cache set failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "cache_set",
    description: "Set a value in cache",
    schema: z.object({
      key: z.string().describe("Cache key"),
      value: z.any().describe("Value to cache"),
      ttlSeconds: z
        .number()
        .optional()
        .describe("Time to live in seconds (default: 3600 = 1 hour)"),
      persistent: z
        .boolean()
        .optional()
        .describe("Also persist to Convex cache (default: false)"),
    }),
  }
);

// ============================================================
// Invalidate Cache Tool
// ============================================================

export const invalidateCacheTool = tool(
  async (input): Promise<ToolResult<void>> => {
    const startTime = Date.now();

    try {
      // Clear from memory cache
      if (input.pattern) {
        // Pattern-based invalidation
        for (const key of memoryCache.keys()) {
          if (key.startsWith(input.pattern)) {
            memoryCache.delete(key);
          }
        }
      } else {
        memoryCache.delete(input.key!);
      }

      // Clear from Convex cache if persistent
      if (input.persistent) {
        if (input.pattern) {
          await convex.mutation(api.cache.invalidatePattern, {
            pattern: input.pattern,
          });
        } else {
          await convex.mutation(api.cache.invalidate, {
            key: input.key!,
          });
        }
      }

      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Cache invalidation failed",
        metadata: {
          duration: Date.now() - startTime,
          cached: false,
          retries: 0,
        },
      };
    }
  },
  {
    name: "cache_invalidate",
    description: "Invalidate cache entries",
    schema: z.object({
      key: z.string().optional().describe("Specific cache key to invalidate"),
      pattern: z
        .string()
        .optional()
        .describe(
          "Prefix pattern to invalidate (e.g., 'paper:' invalidates all paper caches)"
        ),
      persistent: z
        .boolean()
        .optional()
        .describe("Also invalidate persistent Convex cache (default: false)"),
    }),
  }
);

export const cacheTools = {
  cacheGet: getCacheTool,
  cacheSet: setCacheTool,
  cacheInvalidate: invalidateCacheTool,
};
```

---

## Usage Examples

### Using Tools in a LangGraph Node

```typescript
// Example: Using tools in a Research Discovery agent node
import { dataTools, searchTools, llmTools, pdfTools } from "@/agents/tools";

async function processNewPaper(
  state: ResearchState
): Promise<Partial<ResearchState>> {
  const { arxivId } = state.currentPaper;

  // 1. Fetch paper metadata
  const paperResult = await searchTools.arxivFetchById.invoke({ arxivId });
  if (!paperResult.success) {
    return {
      errors: [...state.errors, { step: "fetch", message: paperResult.error! }],
    };
  }

  // 2. Download PDF
  const downloadResult = await pdfTools.downloadPdf.invoke({
    pdfUrl: paperResult.data!.pdfUrl,
    arxivId,
  });
  if (!downloadResult.success) {
    return {
      errors: [
        ...state.errors,
        { step: "download", message: downloadResult.error! },
      ],
    };
  }

  // 3. Extract text
  const textResult = await pdfTools.extractText.invoke({
    localPath: downloadResult.data!.localPath,
  });
  if (!textResult.success) {
    return {
      errors: [
        ...state.errors,
        { step: "extract", message: textResult.error! },
      ],
    };
  }

  // 4. Analyze with LLM
  const analysisResult = await llmTools.structuredOutput.invoke({
    prompt: `Analyze this research paper:\n\n${textResult.data!.text}`,
    schemaName: "paperAnalysis",
  });
  if (!analysisResult.success) {
    return {
      errors: [
        ...state.errors,
        { step: "analyze", message: analysisResult.error! },
      ],
    };
  }

  // 5. Save to database
  const saveResult = await dataTools.createPaper.invoke({
    ...paperResult.data!,
    status: "processed",
  });

  return {
    processedPapers: [
      ...state.processedPapers,
      {
        paper: paperResult.data!,
        analysis: analysisResult.data,
      },
    ],
    status: "processing",
  };
}
```

### Using Tools with LangGraph's ToolNode

```typescript
// Example: Binding tools to a LangGraph with ToolNode
import { StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { getToolsByCategory } from "@/agents/tools";

// Get tools for research discovery agent
const researchTools = getToolsByCategory(["search", "pdf", "llm", "data"]);

// Create tool node
const toolNode = new ToolNode(researchTools);

// Build graph with tool calling
const graph = new StateGraph(ResearchState)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldUseTool, {
    tools: "tools",
    end: END,
  });
```

---

## Environment Variables

Add these to `.env.local`:

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-...

# Search APIs
EXA_API_KEY=...                # Exa.ai semantic search
TAVILY_API_KEY=...             # Tavily fallback search
RAPIDAPI_KEY=...               # RapidAPI key for Crunchbase
                               # Get from: https://rapidapi.com/crunchbase-team1-crunchbase/api/crunchbase

# YouTube Transcript - No API key required
# Uses @playzone/youtube-transcript package (scraping-based)

# Already configured
NEXT_PUBLIC_CONVEX_URL=...
```

### API Setup Notes

**Crunchbase (via RapidAPI):**

1. Sign up at https://rapidapi.com
2. Subscribe to Crunchbase API: https://rapidapi.com/crunchbase-team1-crunchbase/api/crunchbase
3. Copy your RapidAPI key to `RAPIDAPI_KEY`

**YouTube Transcript:**

- Uses `@playzone/youtube-transcript` package
- No API key required (works with public videos)
- Install: `pnpm add @playzone/youtube-transcript`

---

## Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] Create directory structure `src/agents/tools/`
- [ ] Implement shared types (`types.ts`)
- [ ] Implement tool registry (`index.ts`)
- [ ] Set up OpenRouter client (`llm/openrouter.ts`)

### Phase 2: Data Tools

- [ ] Paper CRUD tools (`data/papers.ts`)
- [ ] Insight CRUD tools (`data/insights.ts`)
- [ ] Problem CRUD tools (`data/problems.ts`)
- [ ] Startup CRUD tools (`data/startups.ts`)
- [ ] Research link tools (`data/links.ts`)
- [ ] Solution report tools (`data/reports.ts`)
- [ ] Trend data tools (`data/trends.ts`)
- [ ] Agent task tools (`data/tasks.ts`)
- [ ] Checkpoint tools (`data/checkpoints.ts`)
- [ ] Approval tools (`data/approvals.ts`)

### Phase 3: Search Tools

- [ ] Exa.ai integration (`search/exa.ts`)
- [ ] arXiv API integration (`search/arxiv.ts`)
- [ ] Crunchbase integration via RapidAPI (`search/crunchbase.ts`)
- [ ] YouTube Transcript integration (`search/youtube.ts`)
- [ ] Tavily fallback (`search/tavily.ts`)

### Phase 4: LLM Tools

- [ ] Chat completion tool (`llm/chat.ts`)
- [ ] Structured output tool (`llm/structured.ts`)
- [ ] Streaming tool (`llm/streaming.ts`)

### Phase 5: Processing Tools

- [ ] PDF download tool (`pdf/download.ts`)
- [ ] Text extraction tool (`pdf/extract-text.ts`)
- [ ] Figure extraction tool (`pdf/extract-figures.ts`)
- [ ] Table extraction tool (`pdf/extract-tables.ts`)
- [ ] Reference extraction tool (`pdf/extract-refs.ts`)

### Phase 6: Utility Tools

- [ ] Embedding generation (`embedding/generate.ts`)
- [ ] Batch embeddings (`embedding/batch.ts`)
- [ ] Similarity calculation (`embedding/similarity.ts`)
- [ ] Cache operations (`cache/index.ts`)

### Phase 7: Testing & Documentation

- [ ] Unit tests for each tool category
- [ ] Integration tests with mock APIs
- [ ] Rate limiting and error handling tests
- [ ] API documentation

---

## Cross-References

This tool registry is used by:

- **Plan 3**: Research Discovery Agent - uses `search/arxiv`, `pdf/*`, `llm/*`, `data/papers`
- **Plan 4**: Problem Discovery Agent - uses `search/exa`, `search/crunchbase`, `search/youtube`, `llm/*`, `data/problems`, `data/startups`
- **Plan 5**: Research Linking Agent - uses `embedding/*`, `llm/*`, `data/links`, `data/approvals`
- **Plan 6**: Trends & Analytics - uses `embedding/*`, `llm/*`, `data/trends`
- **Plan 1**: Foundation - uses `data/checkpoints`, `data/tasks` for persistence

All agents share these tools to ensure:

1. Consistent error handling
2. Centralized rate limiting
3. Unified logging and monitoring
4. Reduced code duplication
5. Easier testing and maintenance
