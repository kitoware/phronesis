# Plan 2: Frontend Application

**Timeline:** Weeks 7-12 (parallel)
**Dependencies:** plan_1 (Foundation & Scaffolding)
**Parallel With:** plan_3, plan_4, plan_5, plan_6

---

## Overview

This plan implements the complete frontend application including all pages, UI components, layouts, and real-time data subscriptions using Convex React hooks.

---

## Scope

- All pages and routes (9 main pages)
- UI components (shadcn/ui based)
- Layout components (AppShell, Sidebar, Header)
- React hooks for Convex real-time subscriptions
- Data display components
- Interactive components
- Feedback components

---

## Key Deliverables

1. Dashboard (`/`)
2. Research Explorer (`/research`)
3. Insights Feed (`/insights`)
4. Trends (`/trends`)
5. Problems (`/problems`, `/problems/[id]`)
6. Startups (`/startups`)
7. Links (`/links`)
8. Settings (`/settings`)
9. Complete component library

---

## Git Worktree Setup

```bash
# Create worktree from main after plan_1 is complete
git worktree add ../phronesis-frontend feature/frontend
cd ../phronesis-frontend
```

---

## PRD Sections Extracted

### Section 4: User Personas & Journey Maps

#### 4.1 Primary Persona: Startup Founder - "Alex"

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERSONA: STARTUP ALEX                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Demographics:              Goals:                              │
│  • Age: 32                  • Find untapped tech opportunities  │
│  • Role: Tech Founder       • Stay ahead of market trends       │
│  • Background: Software     • Validate startup ideas quickly    │
│    Engineer                 • Build investor-ready theses       │
│                                                                 │
│  Pain Points:               Behaviors:                          │
│  • Too many papers to read  • Skims HackerNews daily           │
│  • Academic jargon barrier  • Follows key researchers          │
│  • No time for deep dives   • Attends tech conferences         │
│  • Connecting dots is hard  • Networks with VCs                │
│                                                                 │
│  Quote: "I know the next big thing is buried in some paper     │
│         somewhere, I just don't have 100 hours to find it."    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 Secondary Persona: VC Analyst - "Jordan"

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERSONA: VC JORDAN                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Demographics:              Goals:                              │
│  • Age: 28                  • Identify emerging tech sectors    │
│  • Role: VC Associate       • Build investment theses           │
│  • Background: MBA + CS     • Due diligence on deep tech        │
│                             • Impress partners with insights    │
│                                                                 │
│  Pain Points:               Behaviors:                          │
│  • Needs defensible theses  • Reviews 50+ pitch decks/week     │
│  • Partners want data       • Creates market maps               │
│  • Hard to find signals     • Tracks academic spin-offs         │
│  • Limited technical depth  • Reads industry reports            │
│                                                                 │
│  Quote: "I need to explain to my partners why this technology  │
│         will matter in 5 years, with receipts."                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.3 User Journey Map: Startup Alex

| STAGE | AWARENESS | EXPLORATION | ENGAGEMENT | DEEP DIVE | ACTION |
|-------|-----------|-------------|------------|-----------|--------|
| **Actions** | Lands on dashboard | Browses trending topics | Reads insight summaries | Explores related papers & diagrams | Exports opportunity report for co-founder |
| **Thoughts** | "Can this actually help me?" | "Quantum ML is hot, what's new?" | "Finally, I can understand" | "I see how these connect" | "This could be our next venture" |
| **Emotions** | Skeptical | Curious | Engaged | Excited | Motivated |
| **Features Used** | Landing page, Demo | Topic filters, Trend charts | Insight cards, Diagrams, Summaries | Knowledge graph, Paper viewer | Report generator, Export to PDF |
| **Pain Points** | Information overload | Too many categories | Want more context | Complex connections | Need to share easily |
| **Solutions** | Clean, focused UI | AI-powered recommendations | Expandable detail levels | Interactive exploration modes | One-click export with formatting |

---

### Section 5.4: Frontend Application

#### 5.4.1 Page Structure

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Metrics, trending problems, recent research links, top insights |
| `/research` | Research Explorer | Paper search, filtering, detail view |
| `/insights` | Insights Feed | Filterable insight cards with diagrams |
| `/trends` | Trends | Trend overview charts, trend cards |
| `/problems` | Startup Problems | Problem discovery feed, startup tracking, severity filters |
| `/problems/[id]` | Problem Detail | Full problem context, evidence, linked research |
| `/links` | Research Links | Problem-research connections, solution reports |
| `/startups` | Startup Tracker | Tracked Series A+ startups, their problems |
| `/settings` | Settings | User preferences, alerts, categories, tracked startups |

#### 5.4.2 Core Components (shadcn/ui based)

**Layout Components:**
- AppShell
- Sidebar
- Header
- PageContainer

**Data Display Components:**
- PaperCard
- InsightCard
- TrendCard
- ProblemCard
- StartupCard
- ResearchLinkCard
- MetricCard
- DiagramViewer
- TimelineChart
- ComparisonTable
- EvidenceList
- SolutionSynthesisPanel

**Interactive Components:**
- SearchBar
- FilterPanel
- CategorySelector
- DateRangePicker
- ScoreSlider
- BookmarkButton
- StartupTracker
- ProblemSeverityFilter
- TRLRangeSlider

**Feedback Components:**
- LoadingSpinner
- EmptyState
- ErrorBoundary
- Toast
- NewProblemAlert
- ResearchMatchNotification

#### 5.4.3 Real-time Updates

Leverage Convex's real-time subscriptions for live updates:

```typescript
// hooks/use-real-time-problems.ts
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useRealtimeProblems(filters: ProblemFilters) {
  const problems = useQuery(api.problems.list, {
    severityMin: filters.severityMin,
    categories: filters.categories,
    fundingStages: filters.fundingStages,
    limit: filters.limit,
  })

  return {
    problems,
    isLoading: problems === undefined,
  }
}

// hooks/use-research-links.ts
export function useResearchLinks(problemId: string) {
  const links = useQuery(api.researchLinks.byProblem, { problemId })

  return {
    links,
    isLoading: links === undefined,
  }
}
```

---

### Section 11: Performance Requirements

#### 11.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 2 seconds | Time to First Contentful Paint |
| API Response Time | < 500ms (p95) | Convex query latency |
| Real-time Update Latency | < 100ms | Subscription delivery |
| Paper Processing Time | < 5 minutes | End-to-end analysis |
| Search Results | < 1 second | Full-text and vector search |
| Report Generation | < 30 seconds | Full opportunity report |

#### 11.2 Scalability Requirements

**Year 1 Targets:**
- Papers indexed: 50,000
- Daily active users: 1,000
- Concurrent users: 200
- Insights generated: 20,000

**Year 2 Targets:**
- Papers indexed: 200,000
- Daily active users: 10,000
- Concurrent users: 2,000
- Insights generated: 100,000

---

### Appendix C: File Structure (app/ and components/)

```
app/
├── (auth)/                       # Auth routes
│   ├── sign-in/[[...sign-in]]/
│   │   └── page.tsx
│   └── sign-up/[[...sign-up]]/
│       └── page.tsx
├── (dashboard)/                  # Main app routes
│   ├── page.tsx                  # Dashboard
│   ├── research/
│   │   ├── page.tsx              # Paper explorer list
│   │   └── [id]/
│   │       └── page.tsx          # Paper detail
│   ├── insights/
│   │   ├── page.tsx              # Insights feed
│   │   └── [id]/
│   │       └── page.tsx          # Insight detail
│   ├── trends/
│   │   ├── page.tsx              # Trends overview
│   │   └── [id]/
│   │       └── page.tsx          # Trend detail
│   ├── problems/
│   │   ├── page.tsx              # Problem list
│   │   └── [id]/
│   │       └── page.tsx          # Problem detail
│   ├── startups/
│   │   ├── page.tsx              # Startup tracker
│   │   └── [id]/
│   │       └── page.tsx          # Startup detail
│   ├── links/
│   │   ├── page.tsx              # Research-problem links
│   │   └── [id]/
│   │       └── page.tsx          # Link detail with solution report
│   └── settings/
│       └── page.tsx              # User settings
├── layout.tsx                    # Root layout
├── globals.css                   # Global styles
└── providers.tsx                 # Context providers

components/
├── ui/                           # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── slider.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   └── ... (other shadcn components)
├── layout/
│   ├── AppShell.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── PageContainer.tsx
│   └── Footer.tsx
├── papers/
│   ├── PaperCard.tsx
│   ├── PaperDetail.tsx
│   ├── PaperList.tsx
│   ├── PaperFilters.tsx
│   └── PaperSearch.tsx
├── insights/
│   ├── InsightCard.tsx
│   ├── InsightDetail.tsx
│   ├── InsightList.tsx
│   ├── InsightFilters.tsx
│   └── SummaryTabs.tsx
├── trends/
│   ├── TrendCard.tsx
│   ├── TrendChart.tsx
│   ├── TrendList.tsx
│   └── TrendFilters.tsx
├── problems/
│   ├── ProblemCard.tsx
│   ├── ProblemDetail.tsx
│   ├── ProblemList.tsx
│   ├── ProblemFilters.tsx
│   ├── EvidenceList.tsx
│   ├── SeverityBadge.tsx
│   └── CategoryBadge.tsx
├── startups/
│   ├── StartupCard.tsx
│   ├── StartupDetail.tsx
│   ├── StartupList.tsx
│   ├── StartupTracker.tsx
│   ├── FundingBadge.tsx
│   └── FounderList.tsx
├── links/
│   ├── ResearchLinkCard.tsx
│   ├── ResearchLinkDetail.tsx
│   ├── ResearchLinkList.tsx
│   ├── MatchScoreDisplay.tsx
│   ├── SolutionSynthesis.tsx
│   ├── ImplementationRoadmap.tsx
│   └── TRLGapAnalysis.tsx
├── diagrams/
│   ├── DiagramViewer.tsx
│   ├── MermaidRenderer.tsx
│   ├── D3ForceGraph.tsx
│   └── ComparisonMatrix.tsx
├── charts/
│   ├── TimelineChart.tsx
│   ├── TrendLineChart.tsx
│   ├── MetricCard.tsx
│   └── DistributionChart.tsx
├── common/
│   ├── SearchBar.tsx
│   ├── FilterPanel.tsx
│   ├── CategorySelector.tsx
│   ├── DateRangePicker.tsx
│   ├── ScoreSlider.tsx
│   ├── BookmarkButton.tsx
│   ├── LoadingSpinner.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   └── Pagination.tsx
└── notifications/
    ├── NewProblemAlert.tsx
    ├── ResearchMatchNotification.tsx
    └── NotificationCenter.tsx
```

---

## Implementation Checklist

### Week 7-8: Layout & Core Components
- [ ] Implement AppShell with responsive sidebar
- [ ] Create Header with search and notifications
- [ ] Set up PageContainer with consistent styling
- [ ] Install all required shadcn/ui components
- [ ] Create common components (SearchBar, FilterPanel, etc.)
- [ ] Implement LoadingSpinner, EmptyState, ErrorBoundary

### Week 9-10: Main Pages
- [ ] Dashboard page with metrics and feeds
- [ ] Research Explorer with paper list and detail views
- [ ] Insights Feed with filterable cards
- [ ] Trends page with charts and trend cards
- [ ] Problems page with severity filters
- [ ] Problem Detail page with evidence and links
- [ ] Startups page with tracker functionality
- [ ] Links page with solution reports
- [ ] Settings page with user preferences

### Week 11-12: Real-time & Polish
- [ ] Implement all Convex real-time hooks
- [ ] Add real-time update indicators
- [ ] Implement notification system
- [ ] Add bookmark functionality
- [ ] Performance optimization
- [ ] Responsive design testing
- [ ] Accessibility audit

---

## React Hooks to Implement

```typescript
// hooks/use-papers.ts
export function usePapers(filters: PaperFilters)
export function usePaper(id: string)
export function usePaperSearch(query: string)

// hooks/use-insights.ts
export function useInsights(filters: InsightFilters)
export function useInsight(id: string)
export function useInsightsByPaper(paperId: string)

// hooks/use-trends.ts
export function useTrends(filters: TrendFilters)
export function useTrend(id: string)
export function useEmergingTrends()

// hooks/use-problems.ts
export function useProblems(filters: ProblemFilters)
export function useProblem(id: string)
export function useProblemsByStartup(startupId: string)
export function useProblemClusters()

// hooks/use-startups.ts
export function useStartups(filters: StartupFilters)
export function useStartup(id: string)
export function useTrackedStartups()

// hooks/use-research-links.ts
export function useResearchLinks(filters: LinkFilters)
export function useResearchLink(id: string)
export function useResearchLinksByProblem(problemId: string)
export function useResearchLinksByPaper(paperId: string)

// hooks/use-solution-reports.ts
export function useSolutionReport(problemId: string)

// hooks/use-bookmarks.ts
export function useBookmarks()
export function useAddBookmark()
export function useRemoveBookmark()

// hooks/use-user.ts
export function useCurrentUser()
export function useUpdatePreferences()
```

---

## Verification Criteria

- [ ] All 9 pages render correctly
- [ ] Real-time updates work without page refresh
- [ ] Search functionality works across all entities
- [ ] Filters work correctly on all list pages
- [ ] Detail pages show complete information
- [ ] Diagrams render correctly (Mermaid, D3)
- [ ] Charts display data correctly (Recharts)
- [ ] Responsive design works on mobile/tablet
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Page load time < 2 seconds
- [ ] No console errors in production
