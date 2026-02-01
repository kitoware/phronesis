# Plan 5: Research-Problem Linking Agent (Agent 3)

**Timeline:** Weeks 19-24 (parallel)
**Dependencies:** plan_1 (Foundation & Scaffolding)
**Uses Data From:** plan_3 (Research Agent), plan_4 (Problem Discovery Agent)
**Parallel With:** plan_2, plan_3, plan_4, plan_6

---

## Overview

The Research-Problem Linking Agent connects discovered startup problems with relevant arXiv research, identifying academic solutions that could address real-world challenges.

---

## Scope

- Semantic problem-research matching
- Relevance scoring (5 dimensions)
- TRL gap analysis
- Solution synthesis engine
- Report generation
- Bidirectional linking (problem→research & research→problem)

---

## Key Deliverables

1. Semantic matcher (RPL-001)
2. Relevance scorer (RPL-002)
3. Solution synthesis engine (RPL-003)
4. Bidirectional linking (RPL-004)
5. Convex functions: researchLinks, solutionReports
6. PDF export functionality

---

## Git Worktree Setup

```bash
# Create worktree from main after plan_1 is complete
git worktree add ../phronesis-agent3 feature/linking-agent
cd ../phronesis-agent3
```

---

## PRD Sections Extracted

### Section 5.3: Research-Problem Linking Agent (Agent 3)

#### 5.3.1 Agent Overview

The Research-Problem Linking Agent connects discovered startup problems with relevant arXiv research, identifying academic solutions that could address real-world challenges.

```
┌─────────────────────────────────────────────────────────────────┐
│          RESEARCH-PROBLEM LINKING AGENT ARCHITECTURE            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    AGENT ORCHESTRATOR                     │  │
│  │  • Monitors new problems from Agent 2                     │  │
│  │  • Monitors new insights from Agent 1                     │  │
│  │  • Triggers matching workflows                            │  │
│  │  • Generates solution synthesis reports                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │  SEMANTIC   │      │  RELEVANCE  │      │  SOLUTION   │     │
│  │  MATCHER    │─────►│   SCORER    │─────►│ SYNTHESIZER │     │
│  └─────────────┘      └─────────────┘      └─────────────┘     │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │ • Vector    │      │ • Technical │      │ • Solution  │     │
│  │   similarity│      │   fit score │      │   roadmap   │     │
│  │ • Keyword   │      │ • TRL gap   │      │ • Impl.     │     │
│  │   matching  │      │   analysis  │      │   complexity│     │
│  │ • Domain    │      │ • Time to   │      │ • Risk      │     │
│  │   alignment │      │   value     │      │   assessment│     │
│  └─────────────┘      └─────────────┘      └─────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.3.2 Feature: Semantic Problem-Research Matcher

**Feature ID:** RPL-001
**Priority:** P0 (Critical)
**Complexity:** Very High

**Description:** Use semantic search and LLM reasoning to match startup problems with potentially relevant research papers.

**Matching Pipeline:**

1. **Problem Embedding**
   - Embed problem statement
   - Expand with domain keywords
   - Generate search queries

2. **Candidate Retrieval**
   - Vector similarity search against paper embeddings
   - Keyword-based filtering
   - Category alignment scoring

3. **Deep Matching (LLM)**
   - For each candidate paper:
     - Does this research address the problem?
     - What aspects of the problem does it solve?
     - What gaps remain?
   - Generate match confidence score

**Functional Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| RPL-001-01 | Match problems to relevant papers | 85%+ precision on relevance |
| RPL-001-02 | Process new problems in real-time | < 5 min from problem to matches |
| RPL-001-03 | Explain match reasoning | Human-readable justification |
| RPL-001-04 | Handle domain mismatches | Cross-domain matching support |
| RPL-001-05 | Rank matches by actionability | TRL-weighted scoring |

#### 5.3.3 Feature: Relevance & Applicability Scorer

**Feature ID:** RPL-002
**Priority:** P0 (Critical)
**Complexity:** High

**Description:** Score each problem-research link on multiple dimensions to prioritize actionable connections.

**Scoring Dimensions:**

| Dimension | Description | Weight |
|-----------|-------------|--------|
| **Technical Fit** | How directly does the research address the problem? | 30% |
| **TRL Gap** | How much work to go from research to production? | 25% |
| **Time to Value** | How quickly could a startup implement this? | 20% |
| **Novelty** | Is this a new approach vs. existing solutions? | 15% |
| **Evidence Strength** | How robust are the research results? | 10% |

**TRL Gap Analysis:**

```
Paper TRL 3 (Proof of Concept) → Production TRL 9
Gap: 6 levels
Estimated effort: High (12-24 months)
Key milestones:
  - TRL 4: Lab validation
  - TRL 5-6: Prototype in relevant environment
  - TRL 7-8: System demonstration
  - TRL 9: Production deployment
```

**Research Links Schema:**

```typescript
// convex/schema.ts - Research links schema
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
```

#### 5.3.4 Feature: Solution Synthesis Engine

**Feature ID:** RPL-003
**Priority:** P1 (High)
**Complexity:** Very High

**Description:** Generate comprehensive solution reports that bridge research findings to practical startup applications.

**Output: Problem-Research Link Report**

```
┌─────────────────────────────────────────────────────────────────┐
│  PROBLEM-RESEARCH LINK REPORT                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PROBLEM                                                        │
│  ─────────────────────────────────────────────────────────────  │
│  "Data pipeline observability nightmare - 30+ hours/week       │
│   debugging data quality issues"                                │
│  Affected Startups: 47 | Severity: 8/10                        │
│                                                                 │
│  MATCHED RESEARCH                                               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Paper 1: "Automated Data Quality Monitoring via ML"           │
│     arXiv:2401.xxxxx | Jan 2024 | TRL: 4                       │
│     Match Score: 92/100                                         │
│     Key Insight: ML model predicts data quality issues 6hrs    │
│                  before downstream impact                       │
│     Applicability: Direct - core problem addressed             │
│                                                                 │
│  Paper 2: "Causal Root Cause Analysis for Data Pipelines"      │
│     arXiv:2312.xxxxx | Dec 2023 | TRL: 3                       │
│     Match Score: 85/100                                         │
│     Key Insight: Graph-based approach reduces debugging time   │
│                  by 70% in experiments                          │
│     Applicability: Complementary - addresses root cause        │
│                                                                 │
│  Paper 3: "Self-Healing Data Pipelines"                        │
│     arXiv:2402.xxxxx | Feb 2024 | TRL: 2                       │
│     Match Score: 78/100                                         │
│     Key Insight: Automated remediation for common failures     │
│     Applicability: Future potential - lower TRL                │
│                                                                 │
│  SOLUTION SYNTHESIS                                             │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Recommended Approach:                                          │
│  Combine Paper 1's predictive monitoring with Paper 2's        │
│  root cause analysis to create proactive observability.        │
│                                                                 │
│  Implementation Roadmap:                                        │
│  Phase 1 (3 months): Deploy predictive model from Paper 1      │
│  Phase 2 (3 months): Integrate causal analysis from Paper 2    │
│  Phase 3 (6 months): Develop self-healing capabilities         │
│                                                                 │
│  Estimated Impact: 60-80% reduction in debugging time          │
│  Implementation Complexity: Medium-High                         │
│                                                                 │
│  [Export PDF] [Share] [Track Papers] [Contact Researchers]     │
└─────────────────────────────────────────────────────────────────┘
```

**Solution Reports Schema:**

```typescript
// convex/schema.ts - Solution reports schema
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
```

#### 5.3.5 Feature: Bidirectional Linking

**Feature ID:** RPL-004
**Priority:** P1 (High)

**Description:** Enable both problem→research and research→problem discovery flows.

**Use Cases:**

1. **Problem-First Flow** (Primary)
   - Input: Discovered startup problem
   - Output: Relevant research papers with match scores

2. **Research-First Flow** (Secondary)
   - Input: New research insight from Agent 1
   - Output: Startups that could benefit from this research

**Research-First Alert:**

```
┌─────────────────────────────────────────────────────────────────┐
│  NEW RESEARCH ALERT                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Zero-Shot Anomaly Detection in Time Series"                  │
│     Published: Today | TRL: 4 | Impact: High                   │
│                                                                 │
│  This research could help 23 tracked startups:                 │
│                                                                 │
│  • DataFlow AI (Series B) - data quality monitoring           │
│  • MetricsHub (Series A) - observability platform             │
│  • CloudWatch Pro (Series B) - infrastructure monitoring      │
│  ... and 20 more                                               │
│                                                                 │
│  [View All Matches] [Generate Reports]                         │
└─────────────────────────────────────────────────────────────────┘
```

---

### Section 7.1 API: Research Links, Solution Reports

```typescript
// Research Links API
api.researchLinks.list       // List all links
api.researchLinks.byProblem  // Links for a problem
api.researchLinks.byPaper    // Problems linked to a paper
api.researchLinks.validate   // Validate/reject a link
api.researchLinks.topMatches // Highest scoring matches

// Solution Reports API
api.solutionReports.get      // Get report for problem
api.solutionReports.generate // Generate new report
api.solutionReports.export   // Export as PDF
```

---

## Implementation Checklist

### Week 19-20: Semantic Matching
- [ ] Implement problem embedding generation
- [ ] Create vector similarity search against insights
- [ ] Build keyword expansion for problem statements
- [ ] Implement category alignment scoring
- [ ] Create candidate retrieval pipeline
- [ ] Build LLM deep matching chain

### Week 21-22: Relevance Scoring
- [ ] Implement 5-dimension scoring system
- [ ] Create Technical Fit scorer
- [ ] Implement TRL Gap analysis
- [ ] Build Time to Value estimator
- [ ] Create Novelty scorer
- [ ] Implement Evidence Strength scorer
- [ ] Create weighted composite score

### Week 23-24: Solution Synthesis & Reports
- [ ] Build solution synthesis LLM pipeline
- [ ] Create implementation roadmap generator
- [ ] Implement solution report generator
- [ ] Build PDF export functionality
- [ ] Create bidirectional linking system
- [ ] Implement research-first alerts
- [ ] Build user validation workflow

---

## Convex Functions to Implement

```typescript
// convex/researchLinks.ts
export const list = query(...)
export const get = query(...)
export const byProblem = query(...)
export const byPaper = query(...)
export const byInsight = query(...)
export const validate = mutation(...)
export const reject = mutation(...)
export const topMatches = query(...)
export const create = mutation(...)
export const update = mutation(...)

// convex/solutionReports.ts
export const get = query(...)
export const byProblem = query(...)
export const generate = action(...)
export const export = action(...)  // PDF export
export const create = mutation(...)

// convex/agents/researchLinking.ts
export const run = action(...)
export const matchProblemToResearch = action(...)
export const matchResearchToProblems = action(...)
export const scoreMatch = action(...)
export const synthesizeSolution = action(...)
export const generateReport = action(...)
export const processNewProblem = action(...)
export const processNewInsight = action(...)

// convex/crons.ts
crons.interval("link-new-problems", { minutes: 15 }, internal.agents.researchLinking.processNewProblems)
crons.interval("link-new-insights", { minutes: 15 }, internal.agents.researchLinking.processNewInsights)
```

---

## Matching Algorithm Details

### Vector Similarity Search

```typescript
// Problem → Research matching
async function findMatchingResearch(problem: Problem): Promise<MatchCandidate[]> {
  // 1. Generate problem embedding
  const problemEmbedding = await generateEmbedding(problem.problemStatement);

  // 2. Expand with domain keywords
  const expandedQuery = await expandWithKeywords(problem);

  // 3. Vector search against insights
  const candidates = await vectorSearch({
    vector: problemEmbedding,
    topK: 50,
    filter: {
      technologyReadinessLevel: { $gte: 2 }  // At least proof of concept
    }
  });

  // 4. Deep match with LLM
  const rankedCandidates = await Promise.all(
    candidates.map(c => deepMatch(problem, c))
  );

  return rankedCandidates.filter(c => c.score >= 0.7);
}
```

### Scoring Formula

```typescript
function calculateMatchScore(scores: ScoreDimensions): number {
  const weights = {
    technicalFit: 0.30,
    trlGap: 0.25,
    timeToValue: 0.20,
    novelty: 0.15,
    evidenceStrength: 0.10
  };

  // TRL gap is inverted (lower gap = higher score)
  const normalizedTrlGap = 1 - (scores.trlGap / 9);

  return (
    scores.technicalFit * weights.technicalFit +
    normalizedTrlGap * weights.trlGap +
    scores.timeToValue * weights.timeToValue +
    scores.novelty * weights.novelty +
    scores.evidenceStrength * weights.evidenceStrength
  ) * 100;
}
```

---

## Verification Criteria

- [ ] Problem-to-research matching achieves 85%+ precision
- [ ] Matching completes in <5 minutes per problem
- [ ] All 5 scoring dimensions produce valid scores
- [ ] Match reasoning is human-readable
- [ ] Solution reports synthesize multiple papers
- [ ] Implementation roadmaps are actionable
- [ ] PDF export produces valid documents
- [ ] Bidirectional linking works both ways
- [ ] User validation updates link status
- [ ] Research-first alerts trigger correctly
