# Plan 3: Research Discovery Agent (Agent 1)

**Timeline:** Weeks 7-12 (parallel)
**Dependencies:** plan_1 (Foundation & Scaffolding), plan_7 (Agent Tools)
**Parallel With:** plan_2, plan_4, plan_5, plan_6

---

## Overview

The Research Discovery Agent is an autonomous LangGraph-based system responsible for continuously monitoring arXiv, processing academic papers, extracting insights, and generating human-readable outputs with supporting visualizations.

---

## Scope

- arXiv API integration (RSS/API)
- PDF processing pipeline (PyMuPDF)
- LLM analysis engine (5-stage chain via OpenRouter)
- Diagram generation (Mermaid, D3.js)
- Vector embeddings (OpenAI)
- **LangGraph StateGraph orchestration**
- **Convex state persistence**

---

## Key Deliverables

1. Paper ingestion system (RDA-001)
2. PDF processing pipeline (RDA-002)
3. LLM analysis engine (RDA-003)
4. Diagram generation system (RDA-004)
5. Convex functions: papers, paperContent, insights, diagrams
6. **LangGraph StateGraph with nodes and edges**
7. **Shared tools from Plan 7**

---

## Git Worktree Setup

```bash
# Create worktree from main after plan_1 is complete
git worktree add ../phronesis-agent1 feature/research-agent
cd ../phronesis-agent1
```

---

## PRD Sections Extracted

### Section 5.1: Research Discovery Agent (Agent 1)

#### 5.1.1 Agent Overview

The Research Discovery Agent is an autonomous LangGraph-powered system responsible for continuously monitoring arXiv, processing academic papers, extracting insights, and generating human-readable outputs with supporting visualizations.

#### 5.1.2 LangGraph StateGraph Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│           RESEARCH DISCOVERY AGENT - LANGGRAPH STATEGRAPH        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    STATE DEFINITION                        │  │
│  │  {                                                         │  │
│  │    categories: string[]                                   │  │
│  │    fetchedPapers: Paper[]                                 │  │
│  │    processedPapers: ProcessedPaper[]                      │  │
│  │    insights: Insight[]                                    │  │
│  │    diagrams: Diagram[]                                    │  │
│  │    errors: ErrorInfo[]                                    │  │
│  │    status: "fetching" | "processing" | "analyzing" |      │  │
│  │            "generating" | "complete" | "failed"           │  │
│  │    progress: { total: number, current: number }           │  │
│  │  }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      STATE GRAPH                           │  │
│  │                                                            │  │
│  │   START                                                    │  │
│  │     │                                                      │  │
│  │     ▼                                                      │  │
│  │  ┌──────────────┐                                         │  │
│  │  │ fetch_arxiv  │ ─── Fetch new papers from arXiv API     │  │
│  │  └──────────────┘                                         │  │
│  │          │                                                 │  │
│  │          ▼                                                 │  │
│  │  ┌──────────────┐                                         │  │
│  │  │ process_pdfs │ ─── Download & extract PDF content      │  │
│  │  └──────────────┘                                         │  │
│  │          │                                                 │  │
│  │          ▼                                                 │  │
│  │  ┌──────────────┐                                         │  │
│  │  │ analyze_llm  │ ─── 5-stage LLM analysis chain          │  │
│  │  └──────────────┘                                         │  │
│  │          │                                                 │  │
│  │          ▼                                                 │  │
│  │  ┌──────────────┐                                         │  │
│  │  │gen_embeddings│ ─── Generate vector embeddings          │  │
│  │  └──────────────┘                                         │  │
│  │          │                                                 │  │
│  │          ▼                                                 │  │
│  │  ┌──────────────┐                                         │  │
│  │  │ gen_diagrams │ ─── Generate Mermaid/D3 diagrams        │  │
│  │  └──────────────┘                                         │  │
│  │          │                                                 │  │
│  │          ▼                                                 │  │
│  │  ┌──────────────┐                                         │  │
│  │  │  save_to_db  │ ─── Persist to Convex                   │  │
│  │  └──────────────┘                                         │  │
│  │          │                                                 │  │
│  │          ▼                                                 │  │
│  │        END                                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.1.3 State Schema Definition

```typescript
// src/agents/research/state.ts
import { Annotation } from "@langchain/langgraph";

// Define the state schema using LangGraph Annotation
export const ResearchAgentState = Annotation.Root({
  // Input configuration
  categories: Annotation<string[]>({
    reducer: (_, next) => next,
    default: () => ["cs.AI", "cs.LG", "cs.CL"],
  }),

  maxPapers: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 50,
  }),

  // Fetched papers from arXiv
  fetchedPapers: Annotation<ArxivPaper[]>({
    reducer: (current, next) => [...current, ...next],
    default: () => [],
  }),

  // Processed paper content
  processedPapers: Annotation<ProcessedPaper[]>({
    reducer: (current, next) => [...current, ...next],
    default: () => [],
  }),

  // Generated insights
  insights: Annotation<Insight[]>({
    reducer: (current, next) => [...current, ...next],
    default: () => [],
  }),

  // Generated diagrams
  diagrams: Annotation<Diagram[]>({
    reducer: (current, next) => [...current, ...next],
    default: () => [],
  }),

  // Error tracking
  errors: Annotation<ErrorInfo[]>({
    reducer: (current, next) => [...current, ...next],
    default: () => [],
  }),

  // Processing status
  status: Annotation<ProcessingStatus>({
    reducer: (_, next) => next,
    default: () => "fetching",
  }),

  // Progress tracking
  progress: Annotation<Progress>({
    reducer: (_, next) => next,
    default: () => ({ total: 0, current: 0, failed: 0 }),
  }),
});

// Type definitions
export interface ArxivPaper {
  arxivId: string;
  title: string;
  authors: { name: string; affiliations?: string[] }[];
  abstract: string;
  categories: string[];
  primaryCategory: string;
  publishedDate: number;
  updatedDate: number;
  pdfUrl: string;
}

export interface ProcessedPaper extends ArxivPaper {
  sections: Section[];
  figures: Figure[];
  tables: Table[];
  equations: Equation[];
  references: Reference[];
}

export interface Insight {
  paperId: string;
  problemStatement: string;
  proposedSolution: string;
  technicalApproach: string;
  mainResults: string;
  contributions: Contribution[];
  statedLimitations: string[];
  inferredWeaknesses: string[];
  reproducibilityScore: number;
  industryApplications: IndustryApplication[];
  technologyReadinessLevel: number;
  timeToCommercial: string;
  enablingTechnologies: string[];
  summaries: Summaries;
  embedding?: number[];
}

export interface Diagram {
  paperId: string;
  diagramType: "architecture" | "flowchart" | "concept_map" | "comparison";
  title: string;
  description: string;
  format: "mermaid" | "svg" | "d3";
  content: string;
}

export type ProcessingStatus =
  | "fetching"
  | "processing"
  | "analyzing"
  | "generating"
  | "saving"
  | "complete"
  | "failed";

export interface Progress {
  total: number;
  current: number;
  failed: number;
}

export interface ErrorInfo {
  paperId?: string;
  stage: string;
  message: string;
  timestamp: number;
}

export type ResearchAgentStateType = typeof ResearchAgentState.State;
```

#### 5.1.4 StateGraph Implementation

```typescript
// src/agents/research/graph.ts
import { StateGraph, END, START } from "@langchain/langgraph";
import { ResearchAgentState, ResearchAgentStateType } from "./state";
import { fetchArxivNode } from "./nodes/fetch-arxiv";
import { processPdfsNode } from "./nodes/process-pdfs";
import { analyzeLlmNode } from "./nodes/analyze-llm";
import { generateEmbeddingsNode } from "./nodes/generate-embeddings";
import { generateDiagramsNode } from "./nodes/generate-diagrams";
import { saveToDbNode } from "./nodes/save-to-db";
import { ConvexCheckpointer } from "../checkpointer/convex";

// Create the StateGraph
const workflow = new StateGraph(ResearchAgentState)
  // Add nodes
  .addNode("fetch_arxiv", fetchArxivNode)
  .addNode("process_pdfs", processPdfsNode)
  .addNode("analyze_llm", analyzeLlmNode)
  .addNode("generate_embeddings", generateEmbeddingsNode)
  .addNode("generate_diagrams", generateDiagramsNode)
  .addNode("save_to_db", saveToDbNode)

  // Add edges (sequential flow)
  .addEdge(START, "fetch_arxiv")
  .addEdge("fetch_arxiv", "process_pdfs")
  .addEdge("process_pdfs", "analyze_llm")
  .addEdge("analyze_llm", "generate_embeddings")
  .addEdge("generate_embeddings", "generate_diagrams")
  .addEdge("generate_diagrams", "save_to_db")
  .addEdge("save_to_db", END);

// Compile with checkpointer for state persistence
export const researchAgent = workflow.compile({
  checkpointer: new ConvexCheckpointer(),
});

// Export for use by orchestrator
export async function runResearchAgent(config: {
  categories?: string[];
  maxPapers?: number;
  threadId: string;
}) {
  const initialState = {
    categories: config.categories || ["cs.AI", "cs.LG", "cs.CL"],
    maxPapers: config.maxPapers || 50,
  };

  const result = await researchAgent.invoke(initialState, {
    configurable: { thread_id: config.threadId },
  });

  return result;
}
```

#### 5.1.5 Node Implementations

**Fetch arXiv Node:**

```typescript
// src/agents/research/nodes/fetch-arxiv.ts
import { ResearchAgentStateType } from "../state";
import { arxivTool } from "../../tools/search/arxiv";

export async function fetchArxivNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { categories, maxPapers } = state;

  try {
    // Use shared tool from Plan 7
    const papers = await arxivTool.invoke({
      categories,
      maxResults: maxPapers,
      sortBy: "submittedDate",
      sortOrder: "descending",
    });

    return {
      fetchedPapers: papers,
      status: "processing",
      progress: { total: papers.length, current: 0, failed: 0 },
    };
  } catch (error) {
    return {
      status: "failed",
      errors: [
        {
          stage: "fetch_arxiv",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: Date.now(),
        },
      ],
    };
  }
}
```

**Process PDFs Node:**

```typescript
// src/agents/research/nodes/process-pdfs.ts
import { ResearchAgentStateType, ProcessedPaper, ErrorInfo } from "../state";
import { pdfDownloadTool, pdfExtractTool } from "../../tools/pdf";

export async function processPdfsNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { fetchedPapers, progress } = state;

  const processedPapers: ProcessedPaper[] = [];
  const errors: ErrorInfo[] = [];
  let current = 0;
  let failed = 0;

  for (const paper of fetchedPapers) {
    try {
      // Download PDF
      const pdfBuffer = await pdfDownloadTool.invoke({
        url: paper.pdfUrl,
        arxivId: paper.arxivId,
      });

      // Extract content using PyMuPDF via API
      const extracted = await pdfExtractTool.invoke({
        pdfBuffer,
        extractFigures: true,
        extractTables: true,
        extractEquations: true,
      });

      processedPapers.push({
        ...paper,
        sections: extracted.sections,
        figures: extracted.figures,
        tables: extracted.tables,
        equations: extracted.equations,
        references: extracted.references,
      });

      current++;
    } catch (error) {
      failed++;
      errors.push({
        paperId: paper.arxivId,
        stage: "process_pdfs",
        message:
          error instanceof Error ? error.message : "PDF processing failed",
        timestamp: Date.now(),
      });
    }
  }

  return {
    processedPapers,
    status: "analyzing",
    progress: { total: progress.total, current, failed },
    errors,
  };
}
```

**Analyze LLM Node (5-Stage Chain):**

```typescript
// src/agents/research/nodes/analyze-llm.ts
import { ResearchAgentStateType, Insight, ErrorInfo } from "../state";
import { llmChatTool, llmStructuredTool } from "../../tools/llm";
import { z } from "zod";

// Zod schemas for structured output
const ComprehensionSchema = z.object({
  problemStatement: z.string(),
  proposedSolution: z.string(),
  technicalApproach: z.string(),
  evaluationMethodology: z.string(),
  mainResults: z.string(),
});

const ContributionSchema = z.object({
  contributions: z.array(
    z.object({
      rank: z.number(),
      contribution: z.string(),
      noveltyScore: z.number().min(0).max(10),
      evidenceStrength: z.number().min(0).max(10),
    })
  ),
});

const CriticalAnalysisSchema = z.object({
  statedLimitations: z.array(z.string()),
  inferredWeaknesses: z.array(z.string()),
  reproducibilityScore: z.number().min(0).max(10),
});

const ImplicationSchema = z.object({
  industryApplications: z.array(
    z.object({
      industry: z.string(),
      application: z.string(),
      feasibility: z.string(),
    })
  ),
  technologyReadinessLevel: z.number().min(1).max(9),
  timeToCommercial: z.string(),
  enablingTechnologies: z.array(z.string()),
});

const SummarySchema = z.object({
  technical: z.string().max(2500),
  executive: z.string().max(1000),
  tweet: z.string().max(280),
  eli5: z.string().max(500),
});

export async function analyzeLlmNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { processedPapers, progress } = state;

  const insights: Insight[] = [];
  const errors: ErrorInfo[] = [];

  for (const paper of processedPapers) {
    try {
      const fullText = paper.sections
        .map((s) => `${s.title}\n${s.content}`)
        .join("\n\n");

      // Stage 1: Comprehension
      const comprehension = await llmStructuredTool.invoke({
        model: "anthropic/claude-3.5-sonnet",
        schema: ComprehensionSchema,
        prompt: `Analyze this academic paper and extract the key elements:

Title: ${paper.title}
Abstract: ${paper.abstract}

Full Text:
${fullText}

Extract the problem statement, proposed solution, technical approach, evaluation methodology, and main results.`,
      });

      // Stage 2: Contribution Analysis
      const contributions = await llmStructuredTool.invoke({
        model: "anthropic/claude-3.5-sonnet",
        schema: ContributionSchema,
        prompt: `Based on this paper, identify and rank the novel contributions:

Title: ${paper.title}
Technical Approach: ${comprehension.technicalApproach}
Main Results: ${comprehension.mainResults}

Rank contributions by significance, assign novelty scores (0-10) and evidence strength (0-10).`,
      });

      // Stage 3: Critical Analysis
      const critical = await llmStructuredTool.invoke({
        model: "anthropic/claude-3.5-sonnet",
        schema: CriticalAnalysisSchema,
        prompt: `Critically analyze this paper for limitations and reproducibility:

Title: ${paper.title}
Problem: ${comprehension.problemStatement}
Solution: ${comprehension.proposedSolution}
Results: ${comprehension.mainResults}

Identify stated limitations, infer potential weaknesses, and assess reproducibility (0-10).`,
      });

      // Stage 4: Implication Synthesis
      const implications = await llmStructuredTool.invoke({
        model: "anthropic/claude-3.5-sonnet",
        schema: ImplicationSchema,
        prompt: `Analyze the practical implications of this research:

Title: ${paper.title}
Problem: ${comprehension.problemStatement}
Solution: ${comprehension.proposedSolution}
Contributions: ${JSON.stringify(contributions.contributions)}

Identify industry applications, assess Technology Readiness Level (TRL 1-9), estimate time to commercial viability, and list enabling technologies needed.`,
      });

      // Stage 5: Summary Generation
      const summaries = await llmStructuredTool.invoke({
        model: "anthropic/claude-3.5-sonnet",
        schema: SummarySchema,
        prompt: `Generate summaries of this paper at different levels:

Title: ${paper.title}
Abstract: ${paper.abstract}
Problem: ${comprehension.problemStatement}
Solution: ${comprehension.proposedSolution}
Key Contributions: ${contributions.contributions.map((c) => c.contribution).join("; ")}
TRL: ${implications.technologyReadinessLevel}

Generate:
1. Technical Summary (500 words) - for researchers
2. Executive Summary (200 words) - for decision-makers
3. Tweet Summary (280 chars) - for sharing
4. ELI5 Summary (100 words) - for non-technical audiences`,
      });

      insights.push({
        paperId: paper.arxivId,
        problemStatement: comprehension.problemStatement,
        proposedSolution: comprehension.proposedSolution,
        technicalApproach: comprehension.technicalApproach,
        mainResults: comprehension.mainResults,
        contributions: contributions.contributions,
        statedLimitations: critical.statedLimitations,
        inferredWeaknesses: critical.inferredWeaknesses,
        reproducibilityScore: critical.reproducibilityScore,
        industryApplications: implications.industryApplications,
        technologyReadinessLevel: implications.technologyReadinessLevel,
        timeToCommercial: implications.timeToCommercial,
        enablingTechnologies: implications.enablingTechnologies,
        summaries,
      });
    } catch (error) {
      errors.push({
        paperId: paper.arxivId,
        stage: "analyze_llm",
        message: error instanceof Error ? error.message : "LLM analysis failed",
        timestamp: Date.now(),
      });
    }
  }

  return {
    insights,
    status: "generating",
    errors,
  };
}
```

**Generate Embeddings Node:**

```typescript
// src/agents/research/nodes/generate-embeddings.ts
import { ResearchAgentStateType, Insight } from "../state";
import { embeddingTool } from "../../tools/embedding";

export async function generateEmbeddingsNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { insights } = state;

  const insightsWithEmbeddings: Insight[] = [];

  // Batch generate embeddings for efficiency
  const texts = insights.map(
    (insight) =>
      `${insight.problemStatement} ${insight.proposedSolution} ${insight.technicalApproach}`
  );

  try {
    const embeddings = await embeddingTool.invoke({
      texts,
      model: "text-embedding-3-small",
    });

    for (let i = 0; i < insights.length; i++) {
      insightsWithEmbeddings.push({
        ...insights[i],
        embedding: embeddings[i],
      });
    }

    return {
      insights: insightsWithEmbeddings,
    };
  } catch (error) {
    // Continue without embeddings if generation fails
    return {
      errors: [
        {
          stage: "generate_embeddings",
          message:
            error instanceof Error
              ? error.message
              : "Embedding generation failed",
          timestamp: Date.now(),
        },
      ],
    };
  }
}
```

**Generate Diagrams Node:**

```typescript
// src/agents/research/nodes/generate-diagrams.ts
import { ResearchAgentStateType, Diagram, Insight } from "../state";
import { llmChatTool } from "../../tools/llm";

export async function generateDiagramsNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { insights, processedPapers } = state;

  const diagrams: Diagram[] = [];

  for (const insight of insights) {
    try {
      // Generate architecture diagram
      const architectureMermaid = await llmChatTool.invoke({
        model: "anthropic/claude-3.5-sonnet",
        prompt: `Generate a Mermaid flowchart diagram showing the architecture/methodology of this research:

Problem: ${insight.problemStatement}
Solution: ${insight.proposedSolution}
Technical Approach: ${insight.technicalApproach}

Return ONLY valid Mermaid flowchart syntax, starting with "flowchart TD" or "flowchart LR".`,
      });

      diagrams.push({
        paperId: insight.paperId,
        diagramType: "architecture",
        title: "System Architecture",
        description:
          "Visual representation of the proposed solution architecture",
        format: "mermaid",
        content: architectureMermaid.trim(),
      });

      // Generate concept map for key contributions
      const conceptMapMermaid = await llmChatTool.invoke({
        model: "anthropic/claude-3.5-sonnet",
        prompt: `Generate a Mermaid mindmap diagram showing the key concepts and their relationships:

Main Contributions:
${insight.contributions.map((c) => `- ${c.contribution}`).join("\n")}

Enabling Technologies: ${insight.enablingTechnologies.join(", ")}

Return ONLY valid Mermaid mindmap syntax, starting with "mindmap".`,
      });

      diagrams.push({
        paperId: insight.paperId,
        diagramType: "concept_map",
        title: "Concept Map",
        description: "Key concepts and their relationships",
        format: "mermaid",
        content: conceptMapMermaid.trim(),
      });
    } catch (error) {
      // Continue without diagrams if generation fails for this paper
      console.error(`Diagram generation failed for ${insight.paperId}:`, error);
    }
  }

  return {
    diagrams,
  };
}
```

**Save to Database Node:**

```typescript
// src/agents/research/nodes/save-to-db.ts
import { ResearchAgentStateType } from "../state";
import {
  paperCreateTool,
  paperContentCreateTool,
  insightCreateTool,
  diagramCreateTool,
} from "../../tools/data";

export async function saveToDbNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { processedPapers, insights, diagrams, progress } = state;

  try {
    // Save papers
    for (const paper of processedPapers) {
      const paperId = await paperCreateTool.invoke({
        arxivId: paper.arxivId,
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        categories: paper.categories,
        primaryCategory: paper.primaryCategory,
        publishedDate: paper.publishedDate,
        updatedDate: paper.updatedDate,
        pdfUrl: paper.pdfUrl,
        processingStatus: "complete",
        version: 1,
      });

      // Save paper content
      await paperContentCreateTool.invoke({
        paperId,
        sections: paper.sections,
        figures: paper.figures,
        tables: paper.tables,
        equations: paper.equations,
        references: paper.references,
        processingTimestamp: Date.now(),
      });

      // Save insight for this paper
      const insight = insights.find((i) => i.paperId === paper.arxivId);
      if (insight) {
        const insightId = await insightCreateTool.invoke({
          paperId,
          ...insight,
          analysisTimestamp: Date.now(),
          modelVersion: "anthropic/claude-3.5-sonnet",
          confidenceScore: 0.85,
        });

        // Save diagrams for this paper
        const paperDiagrams = diagrams.filter(
          (d) => d.paperId === paper.arxivId
        );
        for (const diagram of paperDiagrams) {
          await diagramCreateTool.invoke({
            paperId,
            insightId,
            ...diagram,
            generatedAt: Date.now(),
          });
        }
      }
    }

    return {
      status: "complete",
      progress: { ...progress, current: progress.total },
    };
  } catch (error) {
    return {
      status: "failed",
      errors: [
        {
          stage: "save_to_db",
          message:
            error instanceof Error ? error.message : "Database save failed",
          timestamp: Date.now(),
        },
      ],
    };
  }
}
```

---

### Section 5.1.6: Feature Specifications

#### Feature: Paper Ingestion System

**Feature ID:** RDA-001
**Priority:** P0 (Critical)
**Complexity:** High

**Description:** Automated system for discovering and ingesting new papers from arXiv across configurable research categories.

**Functional Requirements:**

| ID         | Requirement                                  | Acceptance Criteria                                 |
| ---------- | -------------------------------------------- | --------------------------------------------------- |
| RDA-001-01 | System shall fetch papers via arXiv API      | Successfully retrieve papers with <1% error rate    |
| RDA-001-02 | System shall support configurable categories | Support all 150+ arXiv categories                   |
| RDA-001-03 | System shall download PDF files              | Store PDFs with <5s average download time           |
| RDA-001-04 | System shall extract metadata                | Capture title, authors, abstract, dates, categories |
| RDA-001-05 | System shall detect duplicates               | 100% deduplication accuracy                         |
| RDA-001-06 | System shall handle rate limits              | Respect arXiv 3-second delay requirement            |

#### Feature: PDF Processing Pipeline

**Feature ID:** RDA-002
**Priority:** P0 (Critical)
**Complexity:** High

**Description:** Extract and structure content from academic PDFs, handling complex layouts, figures, tables, and mathematical notation.

**Functional Requirements:**

| ID         | Requirement                            | Acceptance Criteria                   |
| ---------- | -------------------------------------- | ------------------------------------- |
| RDA-002-01 | Extract text with section preservation | 95%+ section identification accuracy  |
| RDA-002-02 | Extract and OCR figures/diagrams       | Capture 90%+ of figures with captions |
| RDA-002-03 | Parse tables to structured format      | 85%+ table structure accuracy         |
| RDA-002-04 | Handle LaTeX mathematical notation     | Correctly render 99% of equations     |
| RDA-002-05 | Extract references/citations           | 95%+ reference extraction accuracy    |
| RDA-002-06 | Process multi-column layouts           | Handle 2-column academic format       |

#### Feature: LLM Analysis Engine

**Feature ID:** RDA-003
**Priority:** P0 (Critical)
**Complexity:** Very High

**Description:** Multi-stage LLM pipeline for deep paper analysis using OpenRouter.

**LLM Chain Stages:**

1. **Stage 1: COMPREHENSION** - Problem, solution, approach, results
2. **Stage 2: CONTRIBUTION ANALYSIS** - Novel contributions ranked
3. **Stage 3: CRITICAL ANALYSIS** - Limitations and weaknesses
4. **Stage 4: IMPLICATION SYNTHESIS** - Industry applications, TRL
5. **Stage 5: SUMMARY GENERATION** - Technical, executive, tweet, ELI5

#### Feature: Diagram Generation System

**Feature ID:** RDA-004
**Priority:** P1 (High)
**Complexity:** High

**Description:** Automatically generate visual diagrams to explain paper concepts.

| Type                  | Use Case                  | Format            |
| --------------------- | ------------------------- | ----------------- |
| Architecture Diagram  | System/model architecture | Mermaid flowchart |
| Methodology Flowchart | Step-by-step process      | Mermaid flowchart |
| Concept Map           | Key concept relationships | Mermaid mindmap   |
| Comparison Matrix     | Paper vs prior work       | HTML Table        |

---

### Section 7.1 API: Papers, Insights, Diagrams

```typescript
// Papers API
api.papers.list; // List papers with filters
api.papers.get; // Get single paper
api.papers.search; // Full-text search
api.papers.getContent; // Get processed content

// Insights API
api.insights.list; // List insights
api.insights.get; // Get single insight
api.insights.search; // Semantic search
api.insights.byPaper; // Get insight for paper

// Diagrams API
api.diagrams.list; // List diagrams
api.diagrams.get; // Get single diagram
api.diagrams.byPaper; // Get diagrams for paper
api.diagrams.byInsight; // Get diagrams for insight
```

---

### Appendix A: arXiv Category Reference

**Computer Science:**

- cs.AI - Artificial Intelligence
- cs.CL - Computation and Language
- cs.CV - Computer Vision
- cs.LG - Machine Learning
- cs.NE - Neural and Evolutionary Computing
- cs.RO - Robotics
- cs.HC - Human-Computer Interaction

**Statistics:**

- stat.ML - Machine Learning

**Physics:**

- quant-ph - Quantum Physics
- physics.comp-ph - Computational Physics

---

## Implementation Checklist

### Week 7-8: LangGraph Setup & Paper Ingestion

- [ ] Set up LangGraph StateGraph structure
- [ ] Define state schema with Annotation
- [ ] Implement fetch_arxiv node
- [ ] Implement arXiv API client (uses tools from Plan 7)
- [ ] Create RSS feed parser for new papers
- [ ] Implement PDF download with rate limiting
- [ ] Create metadata extraction pipeline
- [ ] Implement duplicate detection

### Week 9-10: PDF Processing & LLM Analysis

- [ ] Implement process_pdfs node
- [ ] Integrate PyMuPDF for PDF parsing (via API)
- [ ] Implement section extraction
- [ ] Create figure/table extraction pipeline
- [ ] Implement LaTeX equation handling
- [ ] Implement analyze_llm node with 5-stage chain
- [ ] Create prompt templates for each stage
- [ ] Implement OpenRouter integration via tools

### Week 11-12: Embeddings, Diagrams & Persistence

- [ ] Implement generate_embeddings node
- [ ] Implement generate_diagrams node
- [ ] Create Mermaid diagram templates
- [ ] Implement save_to_db node
- [ ] Create Convex data tools integration
- [ ] Implement Convex checkpointer
- [ ] Test full StateGraph flow
- [ ] Error handling and retry logic

---

## Convex Functions to Implement

```typescript
// convex/papers.ts
export const list = query(...)
export const get = query(...)
export const search = query(...)
export const getContent = query(...)
export const create = mutation(...)
export const updateStatus = mutation(...)

// convex/insights.ts
export const list = query(...)
export const get = query(...)
export const search = query(...)  // Vector search
export const byPaper = query(...)
export const create = mutation(...)

// convex/diagrams.ts
export const list = query(...)
export const get = query(...)
export const byPaper = query(...)
export const byInsight = query(...)
export const create = mutation(...)

// NOTE: No crons.ts - agent is triggered via LangGraph orchestrator
```

---

## Verification Criteria

- [ ] LangGraph StateGraph compiles without errors
- [ ] Papers fetched from arXiv with <1% error rate
- [ ] arXiv rate limits respected (3-second delay)
- [ ] PDFs processed and content extracted
- [ ] PDF text extraction 95%+ accuracy
- [ ] Figures and tables extracted correctly
- [ ] All 5 LLM analysis stages produce output
- [ ] TRL scores generated (1-9 scale)
- [ ] All 4 summary types generated
- [ ] Embeddings stored in vector index
- [ ] Semantic search returns relevant results
- [ ] Diagrams generated in correct Mermaid format
- [ ] State checkpointed to Convex correctly
- [ ] Agent handles errors and continues processing
- [ ] Processing completes in <5 minutes per paper
