# Plan 5: Research-Problem Linking Agent (Agent 3)

**Timeline:** Weeks 19-24 (parallel)
**Dependencies:** plan_1 (Foundation & Scaffolding), plan_7 (Agent Tools)
**Uses Data From:** plan_3 (Research Agent), plan_4 (Problem Discovery Agent)
**Parallel With:** plan_2, plan_3, plan_4, plan_6

---

## Overview

The Research-Problem Linking Agent connects discovered startup problems with relevant arXiv research, identifying academic solutions that could address real-world challenges.

**Architecture:** LangGraph StateGraph with human-in-the-loop approval gates

---

## Scope

- Semantic problem-research matching
- Relevance scoring (5 dimensions)
- TRL gap analysis
- Solution synthesis engine
- Report generation
- Bidirectional linking (problem→research & research→problem)
- Human-in-the-loop validation for high-value matches

---

## Technology Stack

| Technology            | Purpose                                      |
| --------------------- | -------------------------------------------- |
| **LangGraph**         | Agent orchestration with interrupt support   |
| **OpenRouter**        | Unified LLM provider (Claude 3.5 Sonnet)     |
| **Convex**            | Data persistence and real-time subscriptions |
| **Human-in-the-Loop** | Approval gates for high-value matches        |

---

## Key Deliverables

1. LangGraph StateGraph with human approval nodes (RPL-001)
2. Semantic matcher node (RPL-002)
3. Relevance scorer node - 5 dimensions (RPL-003)
4. Human approval checkpoint (RPL-004)
5. Solution synthesis node (RPL-005)
6. Report generation node (RPL-006)
7. Convex persistence functions
8. Shared tools integration from Plan 7

---

## LangGraph Architecture

### Agent Orchestration Pattern (with Human-in-the-Loop)

```
┌─────────────────────────────────────────────────────────────────┐
│         RESEARCH LINKING AGENT (LangGraph StateGraph)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ORCHESTRATOR STATE                       │ │
│  │  • problemId: string                                        │ │
│  │  • problem: Problem                                         │ │
│  │  • candidateInsights: CandidateInsight[]                    │ │
│  │  • scoredMatches: ScoredMatch[]                             │ │
│  │  • approvalStatus: "pending" | "approved" | "rejected"      │ │
│  │  • savedLinks: ResearchLink[]                               │ │
│  │  • solutionReport: SolutionReport | null                    │ │
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
│  │  │  load_problem   │ ──► Fetch problem from Convex        │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │ find_candidates │ ──► Vector similarity + keyword      │   │
│  │  └────────┬────────┘     expansion                        │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │  score_matches  │ ──► 5-dimension scoring + LLM        │   │
│  │  └────────┬────────┘     deep match                       │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │ [CONDITIONAL]   │                                      │   │
│  │  │ High-value?     │──┐                                   │   │
│  │  └────────┬────────┘  │                                   │   │
│  │           │           │                                   │   │
│  │           │ No        │ Yes (score > 85)                  │   │
│  │           │           ▼                                   │   │
│  │           │    ┌─────────────────┐                        │   │
│  │           │    │ human_approval  │ ──► INTERRUPT          │   │
│  │           │    │ (checkpoint)    │     Wait for user      │   │
│  │           │    └────────┬────────┘                        │   │
│  │           │             │                                 │   │
│  │           ▼             ▼                                 │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │   save_links    │ ──► Persist to Convex               │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │  ┌─────────────────┐                                      │   │
│  │  │generate_report  │ ──► LLM synthesis + roadmap          │   │
│  │  └────────┬────────┘                                      │   │
│  │           │                                               │   │
│  │           ▼                                               │   │
│  │         END                                               │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Checkpointing: ConvexCheckpointer (thread-based persistence)   │
│  Human-in-the-Loop: Interrupt for high-value match approval     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## LangGraph Implementation

### State Schema Definition

```typescript
// src/agents/research-linking/state.ts
import { Annotation } from "@langchain/langgraph";

// Type definitions
interface Problem {
  id: string;
  statement: string;
  category: {
    primary: string;
    secondary: string;
  };
  severity: number;
  startupId?: string;
  startupName?: string;
}

interface CandidateInsight {
  id: string;
  paperId: string;
  paperTitle: string;
  arxivId: string;
  summary: string;
  keyFindings: string[];
  technologyReadinessLevel: number;
  embedding: number[];
  similarityScore: number;
}

interface ScoreDimensions {
  technicalFit: number; // 0-1: How directly does research address the problem?
  trlGap: number; // 1-9: Gap from research TRL to production (TRL 9)
  timeToValue: number; // 0-1: How quickly could a startup implement this?
  novelty: number; // 0-1: Is this a new approach vs existing solutions?
  evidenceStrength: number; // 0-1: How robust are the research results?
}

interface ScoredMatch {
  candidateId: string;
  insightId: string;
  paperId: string;
  paperTitle: string;
  scores: ScoreDimensions;
  compositeScore: number;
  matchReasoning: string;
  applicability: "direct" | "complementary" | "partial" | "future_potential";
  implementationRoadmap?: ImplementationPhase[];
}

interface ImplementationPhase {
  phase: number;
  name: string;
  duration: string;
  description: string;
  researchUsed: string[];
}

interface ResearchLink {
  id: string;
  problemId: string;
  insightId: string;
  paperId: string;
  matchScore: number;
  scores: ScoreDimensions;
  matchReasoning: string;
  applicability: string;
  status: "auto_matched" | "validated" | "rejected";
  createdAt: Date;
}

interface SolutionReport {
  id: string;
  problemId: string;
  title: string;
  executiveSummary: string;
  problemAnalysis: {
    statement: string;
    affectedStartups: number;
    severity: number;
    currentSolutions: { name: string; limitations: string[] }[];
  };
  researchSynthesis: {
    keyFindings: string[];
    combinedApproach: string;
    novelContributions: string[];
  };
  implementationPlan: {
    recommendedApproach: string;
    phases: ImplementationPhase[];
    estimatedImpact: string;
    complexity: string;
    risks: string[];
  };
  generatedAt: Date;
}

interface ErrorInfo {
  node: string;
  error: string;
  timestamp: Date;
  recoverable: boolean;
}

type ProcessingStatus =
  | "idle"
  | "loading"
  | "finding_candidates"
  | "scoring"
  | "awaiting_approval"
  | "saving"
  | "generating_report"
  | "complete"
  | "failed";

// LangGraph State Annotation
export const ResearchLinkingState = Annotation.Root({
  // Input
  problemId: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),

  // Loaded problem
  problem: Annotation<Problem | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Candidate insights from vector search
  candidateInsights: Annotation<CandidateInsight[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),

  // Scored and ranked matches
  scoredMatches: Annotation<ScoredMatch[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),

  // Human approval status
  approvalStatus: Annotation<"pending" | "approved" | "rejected" | "skipped">({
    reducer: (_, update) => update,
    default: () => "pending" as const,
  }),

  // Approval notes from human reviewer
  approvalNotes: Annotation<string>({
    reducer: (_, update) => update,
    default: () => "",
  }),

  // Saved research links
  savedLinks: Annotation<ResearchLink[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),

  // Generated solution report
  solutionReport: Annotation<SolutionReport | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Processing status
  status: Annotation<ProcessingStatus>({
    reducer: (_, update) => update,
    default: () => "idle" as ProcessingStatus,
  }),

  // Error tracking
  errors: Annotation<ErrorInfo[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
});

export type ResearchLinkingStateType = typeof ResearchLinkingState.State;
```

### StateGraph Definition with Human-in-the-Loop

```typescript
// src/agents/research-linking/graph.ts
import { StateGraph, START, END, interrupt } from "@langchain/langgraph";
import { ResearchLinkingState, ResearchLinkingStateType } from "./state";
import { ConvexCheckpointer } from "../checkpointer/convex";

// Import nodes
import { loadProblemNode } from "./nodes/load-problem";
import { findCandidatesNode } from "./nodes/find-candidates";
import { scoreMatchesNode } from "./nodes/score-matches";
import { humanApprovalNode } from "./nodes/human-approval";
import { saveLinksNode } from "./nodes/save-links";
import { generateReportNode } from "./nodes/generate-report";

// Conditional edge: determine if human approval is needed
function shouldRequestApproval(state: ResearchLinkingStateType): string {
  // Get highest scoring match
  const topScore = state.scoredMatches[0]?.compositeScore || 0;

  // High-value matches (score > 85) require human approval
  if (topScore > 85) {
    return "human_approval";
  }

  // Lower scores can proceed automatically
  return "save_links";
}

// Build the graph
const builder = new StateGraph(ResearchLinkingState)
  // Add all nodes
  .addNode("load_problem", loadProblemNode)
  .addNode("find_candidates", findCandidatesNode)
  .addNode("score_matches", scoreMatchesNode)
  .addNode("human_approval", humanApprovalNode)
  .addNode("save_links", saveLinksNode)
  .addNode("generate_report", generateReportNode)

  // Define edges
  .addEdge(START, "load_problem")
  .addEdge("load_problem", "find_candidates")
  .addEdge("find_candidates", "score_matches")

  // Conditional edge: high-value matches need approval
  .addConditionalEdges("score_matches", shouldRequestApproval, {
    human_approval: "human_approval",
    save_links: "save_links",
  })

  // After approval (or skip), save links
  .addEdge("human_approval", "save_links")
  .addEdge("save_links", "generate_report")
  .addEdge("generate_report", END);

// Compile with Convex checkpointer and interrupt support
export function createResearchLinkingGraph(convexClient: ConvexClient) {
  const checkpointer = new ConvexCheckpointer(convexClient);

  return builder.compile({
    checkpointer,
    // Enable interrupt on human_approval node
    interruptBefore: ["human_approval"],
  });
}

// Export compiled graph for direct use
export const researchLinkingGraph = builder.compile();
```

### Node Implementations

#### 1. Load Problem Node

```typescript
// src/agents/research-linking/nodes/load-problem.ts
import { ResearchLinkingStateType } from "../state";
import { convexQuery } from "@/agents/tools/data/convex";

export async function loadProblemNode(
  state: ResearchLinkingStateType
): Promise<Partial<ResearchLinkingStateType>> {
  console.log(`[load_problem] Loading problem ${state.problemId}...`);

  try {
    const problem = await convexQuery("startupProblems:get", {
      id: state.problemId,
    });

    if (!problem) {
      throw new Error(`Problem ${state.problemId} not found`);
    }

    // Optionally load associated startup info
    let startupName: string | undefined;
    if (problem.startupId) {
      const startup = await convexQuery("startups:get", {
        id: problem.startupId,
      });
      startupName = startup?.name;
    }

    console.log(
      `[load_problem] Loaded: "${problem.statement.slice(0, 50)}..."`
    );

    return {
      problem: {
        id: problem._id,
        statement: problem.statement,
        category: problem.category,
        severity: problem.severity,
        startupId: problem.startupId,
        startupName,
      },
      status: "finding_candidates",
    };
  } catch (error) {
    console.error("[load_problem] Failed to load problem:", error);
    return {
      status: "failed",
      errors: [
        {
          node: "load_problem",
          error: `Failed to load problem: ${error}`,
          timestamp: new Date(),
          recoverable: false,
        },
      ],
    };
  }
}
```

#### 2. Find Candidates Node (Vector Similarity)

```typescript
// src/agents/research-linking/nodes/find-candidates.ts
import { ResearchLinkingStateType, CandidateInsight } from "../state";
import { generateEmbedding } from "@/agents/tools/embedding";
import { convexQuery } from "@/agents/tools/data/convex";
import { openrouter } from "@/agents/tools/llm/openrouter";

export async function findCandidatesNode(
  state: ResearchLinkingStateType
): Promise<Partial<ResearchLinkingStateType>> {
  console.log("[find_candidates] Searching for relevant research...");

  if (!state.problem) {
    return {
      status: "failed",
      errors: [
        {
          node: "find_candidates",
          error: "No problem loaded",
          timestamp: new Date(),
          recoverable: false,
        },
      ],
    };
  }

  try {
    // 1. Generate problem embedding
    const problemEmbedding = await generateEmbedding(state.problem.statement);

    // 2. Expand problem with domain keywords
    const expandedKeywords = await expandWithKeywords(state.problem);

    // 3. Vector similarity search against insights
    const vectorResults = await convexQuery("insights:vectorSearch", {
      embedding: problemEmbedding,
      limit: 50,
      minTRL: 2, // At least proof of concept
    });

    // 4. Keyword-based filtering to boost relevance
    const keywordBoost = new Map<string, number>();
    for (const result of vectorResults) {
      const keywordMatches = expandedKeywords.filter(
        (kw) =>
          result.summary.toLowerCase().includes(kw.toLowerCase()) ||
          result.keyFindings.some((f: string) =>
            f.toLowerCase().includes(kw.toLowerCase())
          )
      );
      keywordBoost.set(result._id, keywordMatches.length * 0.05);
    }

    // 5. Transform to CandidateInsight format
    const candidates: CandidateInsight[] = vectorResults.map((result: any) => ({
      id: result._id,
      paperId: result.paperId,
      paperTitle: result.paperTitle,
      arxivId: result.arxivId,
      summary: result.summary,
      keyFindings: result.keyFindings,
      technologyReadinessLevel: result.technologyReadinessLevel,
      embedding: result.embedding,
      similarityScore: result._score + (keywordBoost.get(result._id) || 0),
    }));

    // Sort by boosted similarity score
    candidates.sort((a, b) => b.similarityScore - a.similarityScore);

    // Take top 20 for detailed scoring
    const topCandidates = candidates.slice(0, 20);

    console.log(
      `[find_candidates] Found ${topCandidates.length} candidate insights`
    );

    return {
      candidateInsights: topCandidates,
      status: "scoring",
    };
  } catch (error) {
    console.error("[find_candidates] Search failed:", error);
    return {
      status: "failed",
      errors: [
        {
          node: "find_candidates",
          error: `Candidate search failed: ${error}`,
          timestamp: new Date(),
          recoverable: true,
        },
      ],
    };
  }
}

async function expandWithKeywords(problem: Problem): Promise<string[]> {
  const response = await openrouter.chat({
    model: "anthropic/claude-3.5-sonnet",
    messages: [
      {
        role: "user",
        content: `Extract 5-10 technical keywords and domain terms from this problem statement that would help find relevant academic research.

Problem: "${problem.statement}"
Category: ${problem.category.primary} > ${problem.category.secondary}

Return as JSON array of strings.`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const { keywords } = JSON.parse(response.choices[0].message.content);
  return keywords;
}
```

#### 3. Score Matches Node (5-Dimension Scoring)

```typescript
// src/agents/research-linking/nodes/score-matches.ts
import {
  ResearchLinkingStateType,
  ScoredMatch,
  ScoreDimensions,
} from "../state";
import { openrouter } from "@/agents/tools/llm/openrouter";
import { z } from "zod";

const MatchAnalysisSchema = z.object({
  technicalFit: z
    .number()
    .min(0)
    .max(1)
    .describe("How directly does the research address the problem?"),
  timeToValue: z
    .number()
    .min(0)
    .max(1)
    .describe("How quickly could a startup implement this?"),
  novelty: z
    .number()
    .min(0)
    .max(1)
    .describe("Is this a new approach vs existing solutions?"),
  evidenceStrength: z
    .number()
    .min(0)
    .max(1)
    .describe("How robust are the research results?"),
  matchReasoning: z
    .string()
    .describe("Explanation of why this research matches the problem"),
  applicability: z.enum([
    "direct",
    "complementary",
    "partial",
    "future_potential",
  ]),
  implementationPhases: z
    .array(
      z.object({
        phase: z.number(),
        name: z.string(),
        duration: z.string(),
        description: z.string(),
      })
    )
    .optional(),
});

const SCORING_PROMPT = `Analyze how well this research paper addresses the startup problem.

PROBLEM:
"${state.problem.statement}"
Category: ${state.problem.category.primary} > ${state.problem.category.secondary}
Severity: ${state.problem.severity}/10

RESEARCH:
Title: "${candidate.paperTitle}"
Summary: "${candidate.summary}"
Key Findings:
${candidate.keyFindings.map((f) => `- ${f}`).join("\n")}
Technology Readiness Level: ${candidate.technologyReadinessLevel}

Score each dimension from 0 to 1:

1. **Technical Fit** (0-1): Does this research directly address the core problem?
   - 0.9-1.0: Exact match, solves the problem directly
   - 0.7-0.9: Strong match, addresses most aspects
   - 0.5-0.7: Moderate match, partial solution
   - Below 0.5: Weak match, tangentially related

2. **Time to Value** (0-1): How quickly could a startup implement this?
   - Consider TRL level, complexity, dependencies
   - 0.9-1.0: Weeks to implement
   - 0.7-0.9: 1-3 months
   - 0.5-0.7: 3-6 months
   - Below 0.5: 6+ months or significant R&D needed

3. **Novelty** (0-1): Is this a genuinely new approach?
   - 0.9-1.0: Breakthrough approach, no existing alternatives
   - 0.7-0.9: Novel technique, significantly better than alternatives
   - 0.5-0.7: Incremental improvement on existing approaches
   - Below 0.5: Similar to existing commercial solutions

4. **Evidence Strength** (0-1): How robust are the results?
   - 0.9-1.0: Production-tested, multiple validations
   - 0.7-0.9: Strong experimental results, reproducible
   - 0.5-0.7: Promising results, limited testing
   - Below 0.5: Theoretical or preliminary results

Also provide:
- matchReasoning: 2-3 sentences explaining the match
- applicability: direct/complementary/partial/future_potential
- implementationPhases: If applicable, suggest implementation phases`;

export async function scoreMatchesNode(
  state: ResearchLinkingStateType
): Promise<Partial<ResearchLinkingStateType>> {
  console.log(
    `[score_matches] Scoring ${state.candidateInsights.length} candidates...`
  );

  const scoredMatches: ScoredMatch[] = [];

  for (const candidate of state.candidateInsights) {
    try {
      const response = await openrouter.chat({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "user",
            content: SCORING_PROMPT.replace(
              "${state.problem.statement}",
              state.problem!.statement
            )
              .replace(
                "${state.problem.category.primary}",
                state.problem!.category.primary
              )
              .replace(
                "${state.problem.category.secondary}",
                state.problem!.category.secondary
              )
              .replace(
                "${state.problem.severity}",
                String(state.problem!.severity)
              )
              .replace("${candidate.paperTitle}", candidate.paperTitle)
              .replace("${candidate.summary}", candidate.summary)
              .replace(
                "${candidate.keyFindings.map(f => `- ${f}`).join('\\n')}",
                candidate.keyFindings.map((f) => `- ${f}`).join("\n")
              )
              .replace(
                "${candidate.technologyReadinessLevel}",
                String(candidate.technologyReadinessLevel)
              ),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const analysis = MatchAnalysisSchema.parse(
        JSON.parse(response.choices[0].message.content)
      );

      // Calculate TRL gap (inverted for scoring)
      const trlGap = 9 - candidate.technologyReadinessLevel;

      const scores: ScoreDimensions = {
        technicalFit: analysis.technicalFit,
        trlGap,
        timeToValue: analysis.timeToValue,
        novelty: analysis.novelty,
        evidenceStrength: analysis.evidenceStrength,
      };

      // Calculate composite score using weighted formula
      const compositeScore = calculateCompositeScore(scores);

      scoredMatches.push({
        candidateId: candidate.id,
        insightId: candidate.id,
        paperId: candidate.paperId,
        paperTitle: candidate.paperTitle,
        scores,
        compositeScore,
        matchReasoning: analysis.matchReasoning,
        applicability: analysis.applicability,
        implementationRoadmap: analysis.implementationPhases,
      });
    } catch (error) {
      console.error(`[score_matches] Failed to score ${candidate.id}:`, error);
    }
  }

  // Sort by composite score
  scoredMatches.sort((a, b) => b.compositeScore - a.compositeScore);

  // Keep top 10 matches
  const topMatches = scoredMatches.slice(0, 10);

  console.log(
    `[score_matches] Top match score: ${topMatches[0]?.compositeScore || 0}`
  );

  return {
    scoredMatches: topMatches,
    status: "awaiting_approval",
  };
}

function calculateCompositeScore(scores: ScoreDimensions): number {
  const weights = {
    technicalFit: 0.3,
    trlGap: 0.25,
    timeToValue: 0.2,
    novelty: 0.15,
    evidenceStrength: 0.1,
  };

  // Normalize TRL gap (lower gap = higher score)
  const normalizedTrlGap = 1 - scores.trlGap / 9;

  return (
    (scores.technicalFit * weights.technicalFit +
      normalizedTrlGap * weights.trlGap +
      scores.timeToValue * weights.timeToValue +
      scores.novelty * weights.novelty +
      scores.evidenceStrength * weights.evidenceStrength) *
    100
  );
}
```

#### 4. Human Approval Node (Interrupt Point)

```typescript
// src/agents/research-linking/nodes/human-approval.ts
import { ResearchLinkingStateType } from "../state";
import { interrupt } from "@langchain/langgraph";
import { convexMutation } from "@/agents/tools/data/convex";

export async function humanApprovalNode(
  state: ResearchLinkingStateType
): Promise<Partial<ResearchLinkingStateType>> {
  console.log(
    "[human_approval] High-value match detected, requesting approval..."
  );

  const topMatch = state.scoredMatches[0];

  // Create approval request in Convex
  const approvalRequest = await convexMutation("agentApprovals:create", {
    requestId: `approval-${Date.now()}`,
    taskId: state.problemId,
    threadId: state.problemId, // Will be replaced with actual thread ID
    agentType: "research_linking",
    description: `High-value match found: "${topMatch.paperTitle}" for problem "${state.problem?.statement.slice(0, 100)}..."`,
    data: {
      problemId: state.problemId,
      problemStatement: state.problem?.statement,
      topMatch: {
        paperTitle: topMatch.paperTitle,
        compositeScore: topMatch.compositeScore,
        matchReasoning: topMatch.matchReasoning,
        applicability: topMatch.applicability,
        scores: topMatch.scores,
      },
      allMatches: state.scoredMatches.slice(0, 5).map((m) => ({
        paperTitle: m.paperTitle,
        score: m.compositeScore,
        applicability: m.applicability,
      })),
    },
    status: "pending",
    requestedAt: Date.now(),
  });

  // INTERRUPT: This will pause execution until resumed with approval
  const approval = interrupt({
    type: "human_approval",
    approvalId: approvalRequest,
    message: `High-value research match requires approval. Score: ${topMatch.compositeScore}`,
    data: {
      problem: state.problem?.statement,
      topMatch: {
        title: topMatch.paperTitle,
        score: topMatch.compositeScore,
        reasoning: topMatch.matchReasoning,
      },
    },
  });

  // When resumed, approval object contains user's decision
  return {
    approvalStatus: approval.approved ? "approved" : "rejected",
    approvalNotes: approval.notes || "",
    status: "saving",
  };
}
```

#### 5. Save Links Node

```typescript
// src/agents/research-linking/nodes/save-links.ts
import { ResearchLinkingStateType, ResearchLink } from "../state";
import { convexMutation } from "@/agents/tools/data/convex";

export async function saveLinksNode(
  state: ResearchLinkingStateType
): Promise<Partial<ResearchLinkingStateType>> {
  console.log("[save_links] Persisting research links...");

  const savedLinks: ResearchLink[] = [];

  // Filter matches based on approval status
  const matchesToSave =
    state.approvalStatus === "rejected"
      ? [] // Don't save if rejected
      : state.scoredMatches.filter((m) => m.compositeScore >= 70); // Threshold

  for (const match of matchesToSave) {
    try {
      const linkId = await convexMutation("researchLinks:create", {
        problemId: state.problemId,
        insightId: match.insightId,
        paperId: match.paperId,
        matchScore: match.compositeScore,
        scores: match.scores,
        matchReasoning: match.matchReasoning,
        applicability: match.applicability,
        implementationRoadmap: match.implementationRoadmap
          ? {
              phases: match.implementationRoadmap,
              estimatedEffort: estimateEffort(match.scores.trlGap),
              estimatedImpact: estimateImpact(match.scores.technicalFit),
            }
          : undefined,
        status:
          state.approvalStatus === "approved" ? "validated" : "auto_matched",
        createdAt: Date.now(),
        validatedAt:
          state.approvalStatus === "approved" ? Date.now() : undefined,
      });

      savedLinks.push({
        id: linkId,
        problemId: state.problemId,
        insightId: match.insightId,
        paperId: match.paperId,
        matchScore: match.compositeScore,
        scores: match.scores,
        matchReasoning: match.matchReasoning,
        applicability: match.applicability,
        status:
          state.approvalStatus === "approved" ? "validated" : "auto_matched",
        createdAt: new Date(),
      });
    } catch (error) {
      console.error(`[save_links] Failed to save link:`, error);
    }
  }

  console.log(`[save_links] Saved ${savedLinks.length} research links`);

  return {
    savedLinks,
    status: "generating_report",
  };
}

function estimateEffort(trlGap: number): string {
  if (trlGap <= 2) return "Low (1-3 months)";
  if (trlGap <= 4) return "Medium (3-6 months)";
  if (trlGap <= 6) return "High (6-12 months)";
  return "Very High (12-24 months)";
}

function estimateImpact(technicalFit: number): string {
  if (technicalFit >= 0.9) return "Transformative";
  if (technicalFit >= 0.7) return "High";
  if (technicalFit >= 0.5) return "Moderate";
  return "Incremental";
}
```

#### 6. Generate Report Node

```typescript
// src/agents/research-linking/nodes/generate-report.ts
import { ResearchLinkingStateType, SolutionReport } from "../state";
import { openrouter } from "@/agents/tools/llm/openrouter";
import { convexMutation, convexQuery } from "@/agents/tools/data/convex";
import { z } from "zod";

const SolutionReportSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  keyFindings: z.array(z.string()),
  combinedApproach: z.string(),
  novelContributions: z.array(z.string()),
  recommendedApproach: z.string(),
  phases: z.array(
    z.object({
      phase: z.number(),
      name: z.string(),
      duration: z.string(),
      description: z.string(),
      researchUsed: z.array(z.string()),
    })
  ),
  estimatedImpact: z.string(),
  complexity: z.string(),
  risks: z.array(z.string()),
});

const REPORT_PROMPT = `Generate a comprehensive solution report that bridges academic research to practical startup implementation.

PROBLEM:
"${problem.statement}"
Severity: ${problem.severity}/10
${problem.startupName ? `Affected Startup: ${problem.startupName}` : ""}

MATCHED RESEARCH (${matches.length} papers):
${matches
  .map(
    (m, i) => `
${i + 1}. "${m.paperTitle}"
   Match Score: ${m.compositeScore}/100
   Applicability: ${m.applicability}
   Key Insight: ${m.matchReasoning}
`
  )
  .join("")}

Generate a solution report with:
1. **title**: Concise report title
2. **executiveSummary**: 2-3 sentence overview for executives
3. **keyFindings**: Top 3-5 research findings relevant to the problem
4. **combinedApproach**: How to combine insights from multiple papers
5. **novelContributions**: What's new compared to existing solutions
6. **recommendedApproach**: Specific implementation recommendation
7. **phases**: Implementation phases with timeline
8. **estimatedImpact**: Quantified impact (e.g., "60-80% reduction in X")
9. **complexity**: Implementation complexity assessment
10. **risks**: Key implementation risks`;

export async function generateReportNode(
  state: ResearchLinkingStateType
): Promise<Partial<ResearchLinkingStateType>> {
  console.log("[generate_report] Synthesizing solution report...");

  if (state.savedLinks.length === 0) {
    console.log("[generate_report] No links to report on");
    return { status: "complete" };
  }

  try {
    // Get count of similar problems for report context
    const similarProblems = await convexQuery("startupProblems:similar", {
      statement: state.problem!.statement,
      limit: 100,
    });

    const response = await openrouter.chat({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "user",
          content: REPORT_PROMPT.replace(
            "${problem.statement}",
            state.problem!.statement
          )
            .replace("${problem.severity}", String(state.problem!.severity))
            .replace(
              "${problem.startupName ? `Affected Startup: ${problem.startupName}` : ''}",
              state.problem!.startupName
                ? `Affected Startup: ${state.problem!.startupName}`
                : ""
            )
            .replace("${matches.length}", String(state.scoredMatches.length))
            .replace(
              "${matches.map((m, i) => `...`).join('')}",
              state.scoredMatches
                .slice(0, 5)
                .map(
                  (m, i) => `
${i + 1}. "${m.paperTitle}"
   Match Score: ${m.compositeScore.toFixed(1)}/100
   Applicability: ${m.applicability}
   Key Insight: ${m.matchReasoning}
`
                )
                .join("")
            ),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const reportData = SolutionReportSchema.parse(
      JSON.parse(response.choices[0].message.content)
    );

    // Save report to Convex
    const reportId = await convexMutation("solutionReports:create", {
      problemId: state.problemId,
      linkedResearch: state.savedLinks.map((l) => l.id),
      title: reportData.title,
      executiveSummary: reportData.executiveSummary,
      problemAnalysis: {
        statement: state.problem!.statement,
        affectedStartups: similarProblems.length,
        severity: state.problem!.severity,
        currentSolutions: [], // Could be enhanced with market research
      },
      researchSynthesis: {
        keyFindings: reportData.keyFindings,
        combinedApproach: reportData.combinedApproach,
        novelContributions: reportData.novelContributions,
      },
      implementationPlan: {
        recommendedApproach: reportData.recommendedApproach,
        phases: reportData.phases,
        estimatedImpact: reportData.estimatedImpact,
        complexity: reportData.complexity,
        risks: reportData.risks,
      },
      generatedAt: Date.now(),
      modelVersion: "claude-3.5-sonnet",
    });

    const solutionReport: SolutionReport = {
      id: reportId,
      problemId: state.problemId,
      title: reportData.title,
      executiveSummary: reportData.executiveSummary,
      problemAnalysis: {
        statement: state.problem!.statement,
        affectedStartups: similarProblems.length,
        severity: state.problem!.severity,
        currentSolutions: [],
      },
      researchSynthesis: {
        keyFindings: reportData.keyFindings,
        combinedApproach: reportData.combinedApproach,
        novelContributions: reportData.novelContributions,
      },
      implementationPlan: {
        recommendedApproach: reportData.recommendedApproach,
        phases: reportData.phases,
        estimatedImpact: reportData.estimatedImpact,
        complexity: reportData.complexity,
        risks: reportData.risks,
      },
      generatedAt: new Date(),
    };

    console.log(`[generate_report] Report generated: "${reportData.title}"`);

    return {
      solutionReport,
      status: "complete",
    };
  } catch (error) {
    console.error("[generate_report] Report generation failed:", error);
    return {
      status: "complete", // Still complete, just without report
      errors: [
        {
          node: "generate_report",
          error: `Report generation failed: ${error}`,
          timestamp: new Date(),
          recoverable: true,
        },
      ],
    };
  }
}
```

---

## API Routes for Agent Control

### Trigger Agent

```typescript
// src/app/api/agents/research-linking/trigger/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createResearchLinkingGraph } from "@/agents/research-linking/graph";
import { ConvexHttpClient } from "convex/browser";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { problemId } = await req.json();
  if (!problemId) {
    return NextResponse.json({ error: "problemId required" }, { status: 400 });
  }

  const convexClient = new ConvexHttpClient(
    process.env.NEXT_PUBLIC_CONVEX_URL!
  );
  const graph = createResearchLinkingGraph(convexClient);

  const threadId = uuidv4();

  // Create task record
  await convexClient.mutation("agentTasks:create", {
    taskId: threadId,
    agentType: "research_linking",
    status: "running",
    priority: "high",
    payload: { problemId },
    threadId,
    createdAt: Date.now(),
  });

  // Run graph
  graph
    .invoke({ problemId }, { configurable: { thread_id: threadId } })
    .then(async (result) => {
      await convexClient.mutation("agentTasks:update", {
        taskId: threadId,
        status: result.status === "complete" ? "completed" : "failed",
        result: {
          linksCreated: result.savedLinks.length,
          topMatchScore: result.scoredMatches[0]?.compositeScore || 0,
          reportGenerated: !!result.solutionReport,
        },
        completedAt: Date.now(),
      });
    })
    .catch(async (error) => {
      // Check if this is an interrupt (awaiting approval)
      if (error.name === "GraphInterrupt") {
        await convexClient.mutation("agentTasks:update", {
          taskId: threadId,
          status: "awaiting_approval",
        });
      } else {
        await convexClient.mutation("agentTasks:update", {
          taskId: threadId,
          status: "failed",
          error: error.message,
          completedAt: Date.now(),
        });
      }
    });

  return NextResponse.json({
    taskId: threadId,
    message: "Research linking agent started",
  });
}
```

### Approve/Reject Match

```typescript
// src/app/api/agents/research-linking/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createResearchLinkingGraph } from "@/agents/research-linking/graph";
import { ConvexHttpClient } from "convex/browser";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId, approved, notes } = await req.json();

  const convexClient = new ConvexHttpClient(
    process.env.NEXT_PUBLIC_CONVEX_URL!
  );
  const graph = createResearchLinkingGraph(convexClient);

  // Get the task to find the thread ID
  const task = await convexClient.query("agentTasks:get", { taskId });
  if (!task || task.status !== "awaiting_approval") {
    return NextResponse.json({ error: "Invalid task state" }, { status: 400 });
  }

  // Update approval record
  await convexClient.mutation("agentApprovals:update", {
    taskId,
    status: approved ? "approved" : "rejected",
    decidedBy: userId,
    decidedAt: Date.now(),
    notes,
  });

  // Resume the graph with approval decision
  const result = await graph.invoke(
    { approved, notes },
    {
      configurable: { thread_id: task.threadId },
    }
  );

  // Update task status
  await convexClient.mutation("agentTasks:update", {
    taskId,
    status: "completed",
    result: {
      linksCreated: result.savedLinks.length,
      reportGenerated: !!result.solutionReport,
      approvalDecision: approved ? "approved" : "rejected",
    },
    completedAt: Date.now(),
  });

  return NextResponse.json({
    success: true,
    linksCreated: result.savedLinks.length,
    reportGenerated: !!result.solutionReport,
  });
}
```

---

## Convex Functions (Data Persistence Only)

```typescript
// convex/researchLinks.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    problemId: v.string(),
    insightId: v.string(),
    paperId: v.string(),
    matchScore: v.number(),
    scores: v.object({
      technicalFit: v.number(),
      trlGap: v.number(),
      timeToValue: v.number(),
      novelty: v.number(),
      evidenceStrength: v.number(),
    }),
    matchReasoning: v.string(),
    applicability: v.string(),
    implementationRoadmap: v.optional(
      v.object({
        phases: v.array(
          v.object({
            phase: v.number(),
            name: v.string(),
            duration: v.string(),
            description: v.string(),
            researchUsed: v.optional(v.array(v.string())),
          })
        ),
        estimatedEffort: v.string(),
        estimatedImpact: v.string(),
      })
    ),
    status: v.string(),
    createdAt: v.number(),
    validatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("researchLinks", args);
  },
});

export const byProblem = query({
  args: { problemId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("researchLinks")
      .withIndex("by_problem", (q) => q.eq("problemId", args.problemId))
      .order("desc")
      .collect();
  },
});

export const topMatches = query({
  args: {
    limit: v.optional(v.number()),
    minScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("researchLinks");

    if (args.minScore) {
      q = q.filter((q) => q.gte(q.field("matchScore"), args.minScore));
    }

    return await q.order("desc").take(args.limit || 20);
  },
});

// convex/solutionReports.ts
export const create = mutation({
  args: {
    problemId: v.string(),
    linkedResearch: v.array(v.string()),
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
          researchUsed: v.optional(v.array(v.string())),
        })
      ),
      estimatedImpact: v.string(),
      complexity: v.string(),
      risks: v.array(v.string()),
    }),
    generatedAt: v.number(),
    modelVersion: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("solutionReports", args);
  },
});

export const byProblem = query({
  args: { problemId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("solutionReports")
      .withIndex("by_problem", (q) => q.eq("problemId", args.problemId))
      .first();
  },
});
```

---

## Shared Tools Integration (from Plan 7)

This agent uses the following shared tools from `src/agents/tools/`:

| Tool Category | Tools Used                                     |
| ------------- | ---------------------------------------------- |
| **Data**      | `convexQuery`, `convexMutation`                |
| **LLM**       | `openrouter.chat` (structured output with Zod) |
| **Embedding** | `generateEmbedding`                            |

See Plan 7 for full tool implementations.

---

## Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] Define LangGraph state schema with Annotations
- [ ] Implement StateGraph with conditional edges
- [ ] Set up ConvexCheckpointer for state persistence
- [ ] Configure interrupt support for human-in-the-loop
- [ ] Create API routes for triggering and approval

### Phase 2: Matching Pipeline

- [ ] Implement load_problem node
- [ ] Implement find_candidates node with vector search
- [ ] Create keyword expansion using LLM
- [ ] Implement result boosting with keyword matches

### Phase 3: Scoring System

- [ ] Implement score_matches node
- [ ] Create 5-dimension scoring prompts
- [ ] Implement composite score calculation
- [ ] Add applicability classification

### Phase 4: Human-in-the-Loop

- [ ] Implement human_approval node with interrupt
- [ ] Create approval request persistence
- [ ] Build approval API endpoint
- [ ] Implement graph resume logic

### Phase 5: Reports & Persistence

- [ ] Implement save_links node
- [ ] Implement generate_report node
- [ ] Create solution report synthesis prompts
- [ ] Add PDF export functionality (future)

---

## Verification Criteria

- [ ] LangGraph StateGraph compiles without errors
- [ ] Problem-to-research matching achieves 85%+ precision
- [ ] Matching completes in <5 minutes per problem
- [ ] All 5 scoring dimensions produce valid scores
- [ ] High-value matches (>85) trigger human approval
- [ ] Graph correctly pauses on interrupt
- [ ] Approval/rejection properly resumes graph
- [ ] Match reasoning is human-readable
- [ ] Solution reports synthesize multiple papers
- [ ] Implementation roadmaps are actionable
- [ ] ConvexCheckpointer persists state across interrupts
