# Plan 4: Startup Problem Discovery Agent (Agent 2)

**Timeline:** Weeks 13-18 (parallel)
**Dependencies:** plan_1 (Foundation & Scaffolding)
**Parallel With:** plan_2, plan_3, plan_5, plan_6

---

## Overview

The Startup Problem Discovery Agent continuously monitors social channels, forums, and startup databases to identify pain points, challenges, and unmet needs faced by Series A+ startups.

---

## Scope

- Exa.ai unified search integration (primary)
- Tavily/Perplexity (backup)
- Crunchbase startup data tracking
- Pain point extraction pipeline (LLM)
- Problem clustering (HDBSCAN)
- Implicit signal detection
- Founder network intelligence

---

## Key Deliverables

1. Social channel scanner - Exa.ai (SPD-001)
2. Startup database tracker (SPD-002)
3. Pain point extraction engine (SPD-003)
4. Problem clustering (SPD-004)
5. Proactive prediction (SPD-005)
6. Founder network intelligence (SPD-006)
7. Implicit problem detection (SPD-007)
8. Competitive gap analysis (SPD-008)
9. Real-time alert system (SPD-009)
10. Convex functions: startups, startupProblems, founders, implicitSignals

---

## Git Worktree Setup

```bash
# Create worktree from main after plan_1 is complete
git worktree add ../phronesis-agent2 feature/problem-discovery
cd ../phronesis-agent2
```

---

## PRD Sections Extracted

### Section 5.2: Startup Problem Discovery Agent (Agent 2)

#### 5.2.1 Agent Overview

The Startup Problem Discovery Agent continuously monitors social channels, forums, and startup databases to identify pain points, challenges, and unmet needs faced by Series A+ startups.

```
┌─────────────────────────────────────────────────────────────────┐
│         STARTUP PROBLEM DISCOVERY AGENT ARCHITECTURE            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    AGENT ORCHESTRATOR                     │  │
│  │  • Monitors social channels continuously                  │  │
│  │  • Tracks Series A+ startups from databases               │  │
│  │  • Triggers pain point extraction workflows               │  │
│  │  • Manages problem categorization                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │   SOCIAL    │      │   STARTUP   │      │  PAIN POINT │     │
│  │  SCANNER    │─────►│   TRACKER   │─────►│  EXTRACTOR  │     │
│  └─────────────┘      └─────────────┘      └─────────────┘     │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │
│  │ • Reddit    │      │ • Crunchbase│      │ • LLM-based │     │
│  │   API       │      │ • PitchBook │      │   extraction│     │
│  │ • Twitter/X │      │ • CB        │      │ • Problem   │     │
│  │   API       │      │   Insights  │      │   clustering│     │
│  │ • HN API    │      │ • Series A+ │      │ • Severity  │     │
│  │ • Forums    │      │   filtering │      │   scoring   │     │
│  └─────────────┘      └─────────────┘      └─────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.2 Feature: Social Channel Scanner

**Feature ID:** SPD-001
**Priority:** P0 (Critical)
**Complexity:** High

**Description:** Continuously monitor social platforms for startup founders, employees, and users discussing pain points and challenges.

**Unified Search Architecture:**

Instead of integrating with 15+ individual APIs, we use AI-native search engines that can semantically search across all platforms simultaneously.

```
┌─────────────────────────────────────────────────────────────────┐
│              INTELLIGENT SEARCH LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    EXA.AI (Primary)                      │   │
│  │  • Semantic search across entire web                     │   │
│  │  • Neural search understands intent, not just keywords   │   │
│  │  • Returns structured content from any platform          │   │
│  │  • Filters by domain, date, content type                 │   │
│  │  • Auto-extracts relevant snippets                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────┬──────────────────────┐               │
│  │   TAVILY (Backup)    │  PERPLEXITY (Backup) │               │
│  │  • Research-focused  │  • Real-time search  │               │
│  │  • Fact extraction   │  • Source citations  │               │
│  └──────────────────────┴──────────────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Primary Search Provider: Exa.ai**

| Capability | How It Helps |
|------------|--------------|
| **Semantic Search** | "Find startup founders complaining about data pipeline issues" - understands intent |
| **Domain Filtering** | Search only Reddit, Twitter, HN, or specific sites |
| **Content Extraction** | Returns clean text, not just links |
| **Similarity Search** | "Find content similar to this problem statement" |
| **Date Filtering** | Focus on recent discussions (last 7/30/90 days) |
| **Auto-categorization** | Returns content type (tweet, post, article, etc.) |

**Search Query Templates:**

```typescript
// Example Exa queries for problem discovery

// 1. Explicit pain point search
const explicitPainPoints = await exa.search({
  query: "startup founder struggling with scaling infrastructure",
  type: "neural",
  numResults: 100,
  includeDomains: ["reddit.com", "twitter.com", "news.ycombinator.com"],
  startPublishedDate: "2024-01-01",
  contents: { text: true }
});

// 2. Implicit signal search (build vs buy)
const buildVsBuy = await exa.search({
  query: "we built our own internal tool because nothing existed",
  type: "neural",
  numResults: 50,
  contents: { text: true, highlights: true }
});

// 3. Negative review search
const negativeReviews = await exa.search({
  query: "disappointed with limitations missing features",
  includeDomains: ["g2.com", "capterra.com", "trustradius.com"],
  numResults: 100,
  contents: { text: true }
});

// 4. Job posting pain signals
const hiringSignals = await exa.search({
  query: "hiring to fix rebuild scale our broken",
  includeDomains: ["linkedin.com", "lever.co", "greenhouse.io"],
  numResults: 50,
  contents: { text: true }
});

// 5. Founder complaints (high credibility)
const founderComplaints = await exa.search({
  query: "as a founder CEO our biggest challenge problem",
  type: "neural",
  numResults: 100,
  contents: { text: true }
});
```

**Fallback Search Providers:**

| Provider | Use Case | Strengths |
|----------|----------|-----------|
| **Tavily** | Deep research queries, fact extraction | Better for longer-form analysis |
| **Perplexity API** | Real-time trending topics, news | Always up-to-date, good citations |
| **Brave Search API** | Privacy-focused fallback | Independent index |

**Coverage Across Platforms (via Exa):**

| Platform | Indexed | Search Strategy |
|----------|---------|-----------------|
| Reddit | Yes | Domain filter: reddit.com |
| Twitter/X | Yes | Domain filter: twitter.com |
| Hacker News | Yes | Domain filter: news.ycombinator.com |
| LinkedIn | Partial | Public posts indexed |
| GitHub | Yes | Issues, discussions, READMEs |
| G2/Capterra | Yes | Domain filter for reviews |
| Stack Overflow | Yes | Technical Q&A |
| Blogs/Medium | Yes | Startup blogs, postmortems |
| News sites | Yes | TechCrunch, etc. |
| Podcasts | Partial | Transcripts when available |

**Why Unified Search vs Individual APIs:**

| Aspect | Individual APIs (15+) | Unified Search (Exa) |
|--------|----------------------|----------------------|
| **Integration complexity** | 15+ OAuth flows, rate limits, schemas | 1 API key, 1 SDK |
| **Maintenance burden** | API changes, deprecations, outages | Single provider to monitor |
| **Query flexibility** | Fixed endpoints, limited search | Semantic/neural search, any query |
| **Cross-platform search** | Manual aggregation | Single query, all platforms |
| **Cost** | $500-2000+/month combined | ~$100-500/month |
| **Development time** | Weeks per integration | Hours total |
| **Coverage gaps** | Miss platforms without APIs | Web-wide coverage |

**Intelligent Discovery Techniques:**

1. **Founder Social Graph Analysis**
   - Build graph of Series A+ founders and their connections
   - Monitor complaints/frustrations from verified founders
   - Track engagement patterns on problem-related content

2. **Hiring Signal Analysis**
   - Parse job descriptions for pain indicators
   - "We need someone to fix/rebuild/scale our..."
   - "Looking for someone who has solved X problem"
   - Repeated hiring for same role = retention/tooling issue

3. **Negative Review Mining**
   - Aggregate 1-3 star reviews from G2, Capterra, TrustRadius
   - Cluster by complaint type across competing products
   - Identify systematic industry-wide gaps

4. **Postmortem Pattern Extraction**
   - Analyze startup failure postmortems
   - Extract common failure patterns and challenges
   - Map to current startups at similar stages

5. **Support Ticket Pattern Analysis**
   - Monitor public support forums of popular B2B tools
   - Identify recurring issues and workaround requests
   - Track "when will you add X" feature requests

6. **Conference Talk Mining**
   - Transcribe startup conference presentations
   - Extract "challenges we faced" and "lessons learned" sections
   - Identify problems mentioned by multiple speakers

7. **Competitor Comparison Gaps**
   - Scrape "vs" comparison pages and reviews
   - Extract "I wish X had this feature from Y"
   - Identify underserved needs across market

8. **Employee Frustration Signals**
   - Glassdoor/Blind mentions of internal tooling issues
   - "We built internal tools because nothing exists for X"
   - Engineering blog posts about custom solutions

**Search Patterns:**

```
Pain Point Keywords:
- "struggling with", "biggest challenge", "pain point"
- "wish there was", "can't find a solution"
- "our team spends too much time on"
- "broken process", "manual work", "inefficient"
- "scaling issues", "bottleneck", "blocker"
- "built our own", "had to write custom", "nothing exists for"
- "anyone else dealing with", "how do you handle"
- "worst part of my job", "hate dealing with"
- "if only there was", "why doesn't X exist"

Startup Signals:
- "Series A", "Series B", "just raised"
- "YC W24", "YC S24", "backed by"
- "founding team", "our startup", "we're building"
- "@company.com" email domains in profiles
- Verified founder/CEO/CTO badges

Urgency Indicators:
- "urgent", "critical", "blocking us"
- "costing us $X", "losing customers because"
- "need this yesterday", "can't scale without"
```

**Functional Requirements:**

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| SPD-001-01 | Semantic search for startup pain points | Process 1000+ relevant results/day via Exa |
| SPD-001-02 | Multi-platform coverage | Single query covers Reddit, Twitter, HN, GitHub, G2, etc. |
| SPD-001-03 | Intent-based discovery | Neural search understands "founder struggling with X" |
| SPD-001-04 | Filter for Series A+ signals | 90%+ accuracy via Crunchbase enrichment |
| SPD-001-05 | Scheduled discovery runs | Hourly scans with result deduplication |
| SPD-001-06 | Result caching | 24-hour cache to optimize API costs |

#### 5.2.3 Feature: Startup Database Tracker

**Feature ID:** SPD-002
**Priority:** P0 (Critical)
**Complexity:** Medium

**Description:** Track Series A+ startups from funding databases to build a comprehensive list of companies to monitor.

**Data Sources:**

| Source | Data Extracted | Update Frequency |
|--------|---------------|------------------|
| **Crunchbase** | Company profiles, funding rounds, team | Daily |
| **PitchBook** | Detailed financials, investors, valuations | Daily |
| **CB Insights** | Market maps, emerging companies | Weekly |
| **ProductHunt** | New product launches, user feedback | Real-time |
| **AngelList** | Startup profiles, team composition | Weekly |

**Filtering Criteria:**

```typescript
interface StartupFilter {
  fundingStage: "series_a" | "series_b" | "series_c" | "series_d_plus";
  fundingAmount: { min: number; max?: number }; // e.g., $5M - $100M
  foundedDate: { after: Date }; // e.g., last 5 years
  industries: string[]; // e.g., ["AI/ML", "SaaS", "FinTech"]
  employeeCount: { min: number; max: number }; // e.g., 20-500
  location?: string[]; // optional geographic filter
}
```

#### 5.2.4 Feature: Pain Point Extraction Engine

**Feature ID:** SPD-003
**Priority:** P0 (Critical)
**Complexity:** Very High

**Description:** Use LLM-powered analysis to extract, categorize, and score pain points from social content.

**Extraction Pipeline:**

1. **Content Ingestion**
   - Aggregate posts from all social channels
   - Associate with startup profiles where possible
   - Deduplicate and normalize content

2. **Pain Point Identification**
   - LLM extraction of explicit pain points
   - Inference of implicit challenges
   - Context enrichment from thread/replies

3. **Categorization**
   - Technical challenges (scaling, performance, reliability)
   - Operational challenges (hiring, processes, tools)
   - Product challenges (features, UX, adoption)
   - Business challenges (GTM, pricing, competition)

4. **Scoring**
   - Severity score (1-10)
   - Frequency score (how often mentioned)
   - Urgency indicators
   - Addressability score (can research help?)

**Output: Startup Problem Card**

```
┌─────────────────────────────────────────────────────────────────┐
│  STARTUP PROBLEM CARD                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Startup: "DataFlow AI" (Series B, $45M raised)                │
│  Industry: Data Infrastructure | Founded: 2022                  │
│  Source: Reddit r/dataengineering + Twitter                    │
│                                                                 │
│  Problem Statement:                                             │
│  "Our data pipeline observability is a nightmare. We spend     │
│   30+ hours/week debugging data quality issues that surface    │
│   days after they occur."                                       │
│                                                                 │
│  Category: Technical > Data Quality > Observability            │
│                                                                 │
│  Severity: 8/10 | Frequency: High | Urgency: Critical          │
│                                                                 │
│  Evidence:                                                      │
│  • [Reddit post] "Spending entire sprints on data debugging"   │
│  • [Twitter thread] "Why is data observability so hard?"       │
│  • [HN comment] "We built internal tooling, still broken"      │
│                                                                 │
│  Similar Problems Found: 47 other startups                     │
│                                                                 │
│  Research Addressable: Yes (confidence: 85%)                   │
│                                                                 │
│  [View Sources] [Find Research] [Track Startup]                │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.5 Feature: Problem Clustering & Trends

**Feature ID:** SPD-004
**Priority:** P1 (High)

**Description:** Cluster similar problems across startups to identify systemic industry challenges.

**Clustering Approach:**
1. Generate embeddings for each problem statement
2. Apply HDBSCAN clustering
3. Extract cluster themes via LLM summarization
4. Track cluster growth over time

**Output Metrics:**
- Problem cluster size (# of startups affected)
- Cluster growth rate (new problems/week)
- Industry concentration
- Funding stage distribution

#### 5.2.6 Feature: Proactive Problem Prediction

**Feature ID:** SPD-005
**Priority:** P2 (Medium)
**Complexity:** Very High

**Description:** Predict problems that startups will likely face based on their stage, industry, and growth trajectory.

**Prediction Signals:**

1. **Stage-Based Prediction**
   - Map common problems to funding stages
   - Series A: Product-market fit, early scaling
   - Series B: Team scaling, process formalization
   - Series C+: Enterprise readiness, international expansion
   - Alert startups about upcoming challenges

2. **Growth Trajectory Analysis**
   - Monitor headcount growth velocity
   - Predict infrastructure/tooling breaking points
   - "Companies that grew from 50→150 engineers typically face X"

3. **Tech Stack Analysis**
   - Identify technology choices from job postings/GitHub
   - Predict problems based on known limitations
   - "Companies using X at your scale often struggle with Y"

4. **Cohort Pattern Matching**
   - Group startups by industry + stage + tech stack
   - Analyze problems from similar companies 6-12 months ahead
   - Proactive warning system

#### 5.2.7 Feature: Founder Network Intelligence

**Feature ID:** SPD-006
**Priority:** P2 (Medium)
**Complexity:** High

**Description:** Leverage founder social networks to discover problems through trusted connections.

**Network Analysis:**

1. **Founder Influence Mapping**
   - Identify high-signal founders (successful exits, active sharers)
   - Weight their complaints/observations higher
   - Track who they engage with on problem discussions

2. **VC Portfolio Pattern Detection**
   - Monitor problems across a VC's portfolio companies
   - Identify systematic challenges in specific sectors
   - "3 of a]'s portfolio companies are struggling with X"

3. **YC/Accelerator Batch Analysis**
   - Track problems discussed within accelerator batches
   - Identify common challenges at specific stages
   - Monitor batch Slack/forum discussions (where public)

4. **Advisor/Investor Signal Extraction**
   - Track what advisors are warning founders about
   - Monitor investor Twitter threads about portfolio challenges
   - Extract patterns from "what I wish founders knew" content

#### 5.2.8 Feature: Implicit Problem Detection

**Feature ID:** SPD-007
**Priority:** P1 (High)
**Complexity:** Very High

**Description:** Detect problems that aren't explicitly stated but are implied through behavior and context.

**Implicit Signals:**

| Signal Type | Indicator | Problem Inference |
|-------------|-----------|-------------------|
| **Build vs Buy** | "We built our own X" posts | No good solution exists for X |
| **Excessive Hiring** | 5+ job posts for same role | Retention issue or tooling gap |
| **Workaround Sharing** | "Here's how we hack around X" | Fundamental tool limitation |
| **Migration Announcements** | "We switched from X to Y" | X has critical limitations |
| **Open Source Creation** | Startup releases internal tool | Filled a gap, others need it too |
| **Integration Complaints** | "Getting X and Y to work together" | Integration/interop gap |
| **Scale Breakpoints** | "X worked until we hit Y scale" | Tool doesn't scale |
| **Manual Process Mentions** | "Our team manually does X" | Automation opportunity |

**Detection Pipeline:**
1. Monitor for implicit signal patterns in social content
2. LLM-based inference of underlying problem
3. Validate against explicit problem mentions
4. Score confidence and add to problem database

#### 5.2.9 Feature: Competitive Gap Analysis

**Feature ID:** SPD-008
**Priority:** P2 (Medium)
**Complexity:** Medium

**Description:** Analyze competitor products to identify gaps and pain points in the market.

**Analysis Methods:**

1. **Feature Comparison Mining**
   - Scrape pricing/feature pages of competing products
   - Build feature matrices across competitors
   - Identify consistently missing features = market gap
   - Track "coming soon" features across competitors

2. **Changelog Velocity Analysis**
   - Monitor product changelogs/release notes
   - Identify areas of rapid development = active pain points
   - Detect features that get rebuilt multiple times
   - Track deprecations and pivots

3. **Roadmap Extraction**
   - Public roadmap pages (Canny, ProductBoard, etc.)
   - Most-voted feature requests = validated pain points
   - "Under consideration" items = acknowledged gaps
   - Rejected requests with explanations = hard problems

4. **Integration Ecosystem Gaps**
   - Map integration offerings across competitors
   - Identify missing integrations = workflow pain points
   - Track "native vs Zapier" availability
   - Monitor integration request forums

5. **Pricing Tier Analysis**
   - Analyze what features are gated at higher tiers
   - High-tier-only features often = high-value pain points
   - "Enterprise only" features = scaling challenges
   - Price increases on specific features = demand signal

#### 5.2.10 Feature: Real-Time Alert System

**Feature ID:** SPD-009
**Priority:** P1 (High)
**Complexity:** Medium

**Description:** Instant notifications when high-signal pain points are discovered.

**Alert Triggers:**

| Trigger | Threshold | Alert Type |
|---------|-----------|------------|
| High-credibility founder complaint | Credibility > 8/10 | Instant |
| Viral problem thread | Engagement > 100 in 1hr | Instant |
| Multiple startups same problem | 3+ in 24hrs | Daily digest |
| New problem in tracked category | Any | Real-time |
| Implicit signal from tracked startup | Any | Instant |
| Research match for new problem | Score > 80 | Instant |

**Alert Channels:**
- In-app notifications
- Email digest (configurable frequency)
- Slack/Discord webhooks
- API webhooks for custom integrations

---

### Section 7.1 API: Startups, Problems, Founders, Alerts

```typescript
// Startups API
api.startups.list            // List tracked startups
api.startups.get             // Get single startup
api.startups.search          // Search startups
api.startups.track           // Start tracking a startup
api.startups.untrack         // Stop tracking

// Startup Problems API
api.problems.list            // List discovered problems
api.problems.get             // Get single problem
api.problems.search          // Semantic search problems
api.problems.byStartup       // Get problems for a startup
api.problems.byCategory      // Filter by category
api.problems.clusters        // Get problem clusters
api.problems.byDiscoveryMethod // Filter by how discovered
api.problems.implicit        // List implicit signal problems
api.problems.predicted       // Get predicted problems for stage

// Founders API
api.founders.list            // List tracked founders
api.founders.get             // Get single founder
api.founders.topCredibility  // High-signal founders
api.founders.network         // Founder connection graph

// Implicit Signals API
api.implicitSignals.list     // List detected signals
api.implicitSignals.byType   // Filter by signal type
api.implicitSignals.convert  // Convert to formal problem

// Alerts API
api.alerts.configure         // Set alert preferences
api.alerts.list              // List recent alerts
api.alerts.dismiss           // Dismiss an alert
```

---

### Appendix C: File Structure (lib/search/, lib/discovery/)

```
lib/
├── search/                   # Unified search layer
│   ├── exa.ts                # Exa.ai client (primary)
│   ├── tavily.ts             # Tavily client (backup)
│   ├── perplexity.ts         # Perplexity client (real-time)
│   ├── search-orchestrator.ts # Manages search providers
│   └── query-templates.ts    # Pre-built search queries
├── startup-data/             # Startup data enrichment
│   └── crunchbase.ts         # Series A+ data
├── discovery/                # Discovery algorithms
│   ├── pain-point-extractor.ts
│   ├── implicit-signals.ts
│   ├── cohort-prediction.ts
│   ├── network-intelligence.ts
│   └── competitive-gaps.ts
└── cache/                    # Search result caching
    └── search-cache.ts
```

---

## Implementation Checklist

### Week 13-14: Search Infrastructure
- [ ] Implement Exa.ai client
- [ ] Create Tavily fallback client
- [ ] Implement Perplexity client
- [ ] Build search orchestrator with failover
- [ ] Create query templates for all discovery patterns
- [ ] Implement 24-hour result caching

### Week 15-16: Startup Tracking & Pain Point Extraction
- [ ] Implement Crunchbase API integration
- [ ] Create startup filtering system
- [ ] Build pain point extraction LLM pipeline
- [ ] Implement problem categorization
- [ ] Create severity scoring algorithm
- [ ] Build problem card generator

### Week 17-18: Advanced Discovery & Alerts
- [ ] Implement problem clustering (HDBSCAN)
- [ ] Create implicit signal detection
- [ ] Build founder network intelligence
- [ ] Implement competitive gap analysis
- [ ] Create real-time alert system
- [ ] Build cohort-based prediction

---

## Convex Functions to Implement

```typescript
// convex/startups.ts
export const list = query(...)
export const get = query(...)
export const search = query(...)
export const track = mutation(...)
export const untrack = mutation(...)
export const create = mutation(...)
export const update = mutation(...)

// convex/problems.ts
export const list = query(...)
export const get = query(...)
export const search = query(...)  // Vector search
export const byStartup = query(...)
export const byCategory = query(...)
export const clusters = query(...)
export const byDiscoveryMethod = query(...)
export const implicit = query(...)
export const predicted = query(...)
export const create = mutation(...)
export const update = mutation(...)

// convex/founders.ts
export const list = query(...)
export const get = query(...)
export const topCredibility = query(...)
export const network = query(...)
export const create = mutation(...)

// convex/implicitSignals.ts
export const list = query(...)
export const byType = query(...)
export const convert = mutation(...)
export const create = mutation(...)

// convex/alerts.ts
export const configure = mutation(...)
export const list = query(...)
export const dismiss = mutation(...)
export const create = mutation(...)

// convex/agents/problemDiscovery.ts
export const run = action(...)
export const scanSocialChannels = action(...)
export const syncStartups = action(...)
export const extractPainPoints = action(...)
export const clusterProblems = action(...)
export const detectImplicitSignals = action(...)
export const predictProblems = action(...)

// convex/crons.ts
crons.interval("scan-social", { hours: 1 }, internal.agents.problemDiscovery.scanSocialChannels)
crons.interval("sync-startups", { hours: 24 }, internal.agents.problemDiscovery.syncStartups)
crons.interval("cluster-problems", { hours: 6 }, internal.agents.problemDiscovery.clusterProblems)
```

---

## Verification Criteria

- [ ] Exa.ai search returns relevant results
- [ ] Fallback to Tavily works when Exa fails
- [ ] Crunchbase integration syncs Series A+ startups
- [ ] Pain points extracted with 85%+ accuracy
- [ ] Problems categorized correctly
- [ ] Severity scores correlate with urgency
- [ ] Problem clustering produces coherent themes
- [ ] Implicit signals detected and validated
- [ ] Alerts trigger correctly based on thresholds
- [ ] 24-hour caching reduces API costs
- [ ] Processing completes in <1 hour for full scan
