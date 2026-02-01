# Plan 3: Research Discovery Agent (Agent 1)

**Timeline:** Weeks 7-12 (parallel)
**Dependencies:** plan_1 (Foundation & Scaffolding)
**Parallel With:** plan_2, plan_4, plan_5, plan_6

---

## Overview

The Research Discovery Agent is an autonomous system responsible for continuously monitoring arXiv, processing academic papers, extracting insights, and generating human-readable outputs with supporting visualizations.

---

## Scope

- arXiv API integration (RSS/API)
- PDF processing pipeline (PyMuPDF)
- LLM analysis engine (5-stage Claude chain)
- Diagram generation (Mermaid, D3.js)
- Vector embeddings (OpenAI)
- Agent orchestrator

---

## Key Deliverables

1. Paper ingestion system (RDA-001)
2. PDF processing pipeline (RDA-002)
3. LLM analysis engine (RDA-003)
4. Diagram generation system (RDA-004)
5. Convex functions: papers, paperContent, insights, diagrams
6. Agent orchestrator with scheduling

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

The Research Discovery Agent is an autonomous system responsible for continuously monitoring arXiv, processing academic papers, extracting insights, and generating human-readable outputs with supporting visualizations.

```
┌─────────────────────────────────────────────────────────────────┐
│              RESEARCH DISCOVERY AGENT ARCHITECTURE              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    AGENT ORCHESTRATOR                     │  │
│  │  • Manages agent lifecycle and state                      │  │
│  │  • Coordinates sub-components                             │  │
│  │  • Handles error recovery                                 │  │
│  │  • Schedules processing tasks                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │   FETCHER   │      │   ANALYZER  │      │  GENERATOR  │     │
│  │  Component  │─────►│  Component  │─────►│  Component  │     │
│  └─────────────┘      └─────────────┘      └─────────────┘     │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │ • arXiv API │      │ • PDF Parse │      │ • Summaries │     │
│  │ • RSS Feed  │      │ • LLM Chain │      │ • Diagrams  │     │
│  │ • PDF DL    │      │ • Embedding │      │ • Reports   │     │
│  │ • Metadata  │      │ • Classify  │      │ • Alerts    │     │
│  └─────────────┘      └─────────────┘      └─────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.1.2 Feature: Paper Ingestion System

**Feature ID:** RDA-001
**Priority:** P0 (Critical)
**Complexity:** High

**Description:** Automated system for discovering and ingesting new papers from arXiv across configurable research categories.

**Functional Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| RDA-001-01 | System shall fetch papers via arXiv API | Successfully retrieve papers with <1% error rate |
| RDA-001-02 | System shall support configurable categories | Support all 150+ arXiv categories |
| RDA-001-03 | System shall download PDF files | Store PDFs with <5s average download time |
| RDA-001-04 | System shall extract metadata | Capture title, authors, abstract, dates, categories |
| RDA-001-05 | System shall detect duplicates | 100% deduplication accuracy |
| RDA-001-06 | System shall handle rate limits | Respect arXiv 3-second delay requirement |

**Technical Specification:**

```typescript
// convex/schema.ts - Paper ingestion schema
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
  })
```

#### 5.1.3 Feature: PDF Processing Pipeline

**Feature ID:** RDA-002
**Priority:** P0 (Critical)
**Complexity:** High

**Description:** Extract and structure content from academic PDFs, handling complex layouts, figures, tables, and mathematical notation.

**Functional Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| RDA-002-01 | Extract text with section preservation | 95%+ section identification accuracy |
| RDA-002-02 | Extract and OCR figures/diagrams | Capture 90%+ of figures with captions |
| RDA-002-03 | Parse tables to structured format | 85%+ table structure accuracy |
| RDA-002-04 | Handle LaTeX mathematical notation | Correctly render 99% of equations |
| RDA-002-05 | Extract references/citations | 95%+ reference extraction accuracy |
| RDA-002-06 | Process multi-column layouts | Handle 2-column academic format |

**Technical Implementation:**

```typescript
// convex/schema.ts - Paper content schema
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
```

#### 5.1.4 Feature: LLM Analysis Engine

**Feature ID:** RDA-003
**Priority:** P0 (Critical)
**Complexity:** Very High

**Description:** Multi-stage LLM pipeline for deep paper analysis, extracting insights, identifying contributions, and generating summaries at multiple detail levels.

**LLM Chain Stages:**

1. **Stage 1: COMPREHENSION**
   - Problem statement extraction
   - Proposed solution identification
   - Technical approach description
   - Evaluation methodology
   - Main results

2. **Stage 2: CONTRIBUTION ANALYSIS**
   - Novel contributions (ranked)
   - Comparison to prior work
   - Technical innovations
   - Methodological advances

3. **Stage 3: CRITICAL ANALYSIS**
   - Stated limitations
   - Inferred weaknesses
   - Reproducibility assessment
   - Validity of claims

4. **Stage 4: IMPLICATION SYNTHESIS**
   - Industry applications
   - Technology readiness level (TRL 1-9)
   - Time to commercial viability
   - Required enabling technologies
   - Potential disruptions

5. **Stage 5: SUMMARY GENERATION**
   - Technical Summary (500 words) - for researchers
   - Executive Summary (200 words) - for decision-makers
   - Tweet Summary (280 chars) - for sharing
   - ELI5 Summary (100 words) - for non-technical audiences

**Insights Schema:**

```typescript
// convex/schema.ts - Insights schema
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
```

#### 5.1.5 Feature: Diagram Generation System

**Feature ID:** RDA-004
**Priority:** P1 (High)
**Complexity:** High

**Description:** Automatically generate visual diagrams to explain paper concepts, architectures, and relationships.

**Diagram Types:**

| Type | Use Case | Format |
|------|----------|--------|
| Architecture Diagram | System/model architecture | Mermaid flowchart / SVG |
| Methodology Flowchart | Step-by-step process | Mermaid flowchart |
| Comparison Matrix | Paper vs prior work | HTML Table / React |
| Concept Map | Key concept relationships | D3.js Force Graph |
| Technology Timeline | Research evolution | Recharts / D3.js |

**Diagrams Schema:**

```typescript
// convex/schema.ts - Diagrams schema
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
```

---

### Section 7.1 API: Papers, Insights, Diagrams

```typescript
// Papers API
api.papers.list              // List papers with filters
api.papers.get               // Get single paper
api.papers.search            // Full-text search
api.papers.getContent        // Get processed content

// Insights API
api.insights.list            // List insights
api.insights.get             // Get single insight
api.insights.search          // Semantic search
api.insights.byPaper         // Get insight for paper

// Diagrams API
api.diagrams.list            // List diagrams
api.diagrams.get             // Get single diagram
api.diagrams.byPaper         // Get diagrams for paper
api.diagrams.byInsight       // Get diagrams for insight

// Agent API (internal)
internal.agents.research.run
internal.agents.research.processQueue
internal.agents.research.retryFailed
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

### Week 7-8: Paper Ingestion
- [ ] Implement arXiv API client
- [ ] Create RSS feed parser for new papers
- [ ] Implement PDF download with rate limiting
- [ ] Create metadata extraction pipeline
- [ ] Implement duplicate detection
- [ ] Set up Convex scheduled jobs for ingestion
- [ ] Store PDFs in Convex File Storage

### Week 9-10: PDF Processing & LLM Analysis
- [ ] Integrate PyMuPDF for PDF parsing
- [ ] Implement section extraction
- [ ] Create figure/table extraction pipeline
- [ ] Implement LaTeX equation handling
- [ ] Create reference extraction
- [ ] Implement 5-stage LLM analysis chain
- [ ] Create prompt templates for each stage
- [ ] Implement Claude API integration

### Week 11-12: Embeddings & Diagrams
- [ ] Implement OpenAI embeddings generation
- [ ] Store embeddings in Convex vector index
- [ ] Implement semantic search on insights
- [ ] Create Mermaid diagram generator
- [ ] Create D3.js concept map generator
- [ ] Implement comparison matrix generator
- [ ] Create agent orchestrator with error recovery

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

// convex/agents/research.ts
export const run = action(...)
export const processQueue = action(...)
export const retryFailed = action(...)
export const fetchPaper = action(...)
export const processPdf = action(...)
export const analyzePaper = action(...)
export const generateDiagrams = action(...)
export const generateEmbedding = action(...)

// convex/crons.ts
crons.interval("fetch-new-papers", { hours: 1 }, internal.agents.research.run)
crons.interval("process-queue", { minutes: 5 }, internal.agents.research.processQueue)
```

---

## Verification Criteria

- [ ] Papers fetched from arXiv with <1% error rate
- [ ] arXiv rate limits respected (3-second delay)
- [ ] PDFs stored in Convex File Storage
- [ ] PDF text extraction 95%+ accuracy
- [ ] Figures and tables extracted correctly
- [ ] All 5 LLM analysis stages produce output
- [ ] TRL scores generated (1-9 scale)
- [ ] All 4 summary types generated
- [ ] Embeddings stored in vector index
- [ ] Semantic search returns relevant results
- [ ] Diagrams generated in correct format
- [ ] Agent handles errors and retries failed papers
- [ ] Processing completes in <5 minutes per paper
