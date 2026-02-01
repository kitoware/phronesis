# Plan 2: Frontend Application

**Timeline:** Weeks 7-12 (parallel)
**Dependencies:** plan_1 (Foundation & Scaffolding)
**Parallel With:** plan_3, plan_4, plan_5, plan_6, plan_7

---

## Overview

This plan implements the complete frontend application including all pages, UI components, layouts, real-time data subscriptions using Convex React hooks, and **agent monitoring dashboard for LangGraph workflows**.

---

## Scope

- All pages and routes (11 main pages including agent monitoring)
- UI components (shadcn/ui based)
- Layout components (AppShell, Sidebar, Header)
- React hooks for Convex real-time subscriptions
- Data display components
- Interactive components
- Feedback components
- **Agent monitoring dashboard**
- **Human-in-the-loop approval UI**
- **Task queue visualization**

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
9. **Agent Dashboard (`/agents`)** - NEW
10. **Task Queue (`/agents/tasks`)** - NEW
11. **Approval Queue (`/agents/approvals`)** - NEW
12. Complete component library

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

| STAGE             | AWARENESS                    | EXPLORATION                      | ENGAGEMENT                         | DEEP DIVE                          | ACTION                                    |
| ----------------- | ---------------------------- | -------------------------------- | ---------------------------------- | ---------------------------------- | ----------------------------------------- |
| **Actions**       | Lands on dashboard           | Browses trending topics          | Reads insight summaries            | Explores related papers & diagrams | Exports opportunity report for co-founder |
| **Thoughts**      | "Can this actually help me?" | "Quantum ML is hot, what's new?" | "Finally, I can understand"        | "I see how these connect"          | "This could be our next venture"          |
| **Emotions**      | Skeptical                    | Curious                          | Engaged                            | Excited                            | Motivated                                 |
| **Features Used** | Landing page, Demo           | Topic filters, Trend charts      | Insight cards, Diagrams, Summaries | Knowledge graph, Paper viewer      | Report generator, Export to PDF           |
| **Pain Points**   | Information overload         | Too many categories              | Want more context                  | Complex connections                | Need to share easily                      |
| **Solutions**     | Clean, focused UI            | AI-powered recommendations       | Expandable detail levels           | Interactive exploration modes      | One-click export with formatting          |

---

### Section 5.4: Frontend Application

#### 5.4.1 Page Structure

| Route               | Page                | Description                                                     |
| ------------------- | ------------------- | --------------------------------------------------------------- |
| `/`                 | Dashboard           | Metrics, trending problems, recent research links, top insights |
| `/research`         | Research Explorer   | Paper search, filtering, detail view                            |
| `/insights`         | Insights Feed       | Filterable insight cards with diagrams                          |
| `/trends`           | Trends              | Trend overview charts, trend cards                              |
| `/problems`         | Startup Problems    | Problem discovery feed, startup tracking, severity filters      |
| `/problems/[id]`    | Problem Detail      | Full problem context, evidence, linked research                 |
| `/links`            | Research Links      | Problem-research connections, solution reports                  |
| `/startups`         | Startup Tracker     | Tracked Series A+ startups, their problems                      |
| `/settings`         | Settings            | User preferences, alerts, categories, tracked startups          |
| `/agents`           | **Agent Dashboard** | Overview of all LangGraph agents, status, metrics               |
| `/agents/tasks`     | **Task Queue**      | Pending/running tasks, priority management                      |
| `/agents/approvals` | **Approval Queue**  | Human-in-the-loop approval requests                             |

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

**Agent Monitoring Components (NEW):**

- AgentDashboard
- AgentStatusCard
- TaskQueue
- TaskCard
- ApprovalQueue
- ApprovalRequestCard
- AgentRunHistory
- AgentMetrics
- TaskPriorityBadge
- AgentTypeBadge

#### 5.4.3 Real-time Updates

Leverage Convex's real-time subscriptions for live updates:

```typescript
// hooks/use-real-time-problems.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useRealtimeProblems(filters: ProblemFilters) {
  const problems = useQuery(api.problems.list, {
    severityMin: filters.severityMin,
    categories: filters.categories,
    fundingStages: filters.fundingStages,
    limit: filters.limit,
  });

  return {
    problems,
    isLoading: problems === undefined,
  };
}

// hooks/use-research-links.ts
export function useResearchLinks(problemId: string) {
  const links = useQuery(api.researchLinks.byProblem, { problemId });

  return {
    links,
    isLoading: links === undefined,
  };
}
```

---

### Section 5.4.4: Agent Monitoring Dashboard (NEW)

#### Agent Dashboard Overview

The agent monitoring dashboard provides visibility into LangGraph agent workflows, including:

- Real-time agent status (running, idle, failed)
- Task queue management with priority controls
- Human-in-the-loop approval interface
- Agent run history and metrics
- Error tracking and recovery

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT MONITORING DASHBOARD                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      AGENT STATUS OVERVIEW                   ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ ││
│  │  │ Research  │  │ Problem   │  │ Linking   │  │  Trend    │ ││
│  │  │ Discovery │  │ Discovery │  │  Agent    │  │ Analysis  │ ││
│  │  │   ● IDLE  │  │ ● RUNNING │  │ ● WAITING │  │   ● IDLE  │ ││
│  │  │ 47 today  │  │ 23 today  │  │  5 queue  │  │ 12 today  │ ││
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      PENDING APPROVALS                       ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │ High-Value Match Detected                      [Review] │││
│  │  │ Problem: "Data Pipeline Observability"                  │││
│  │  │ Matched to: 3 papers (Score: 92/100)                   │││
│  │  │ Requested: 5 minutes ago                               │││
│  │  └─────────────────────────────────────────────────────────┘││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │ New Startup Problem Cluster                    [Review] │││
│  │  │ Theme: "ML Model Deployment at Scale"                   │││
│  │  │ Affects: 12 startups (Series A-B)                      │││
│  │  │ Requested: 12 minutes ago                              │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      TASK QUEUE                              ││
│  │  Priority │ Type              │ Status   │ Progress         ││
│  │  ─────────┼───────────────────┼──────────┼─────────────────  ││
│  │  CRITICAL │ Process Papers    │ Running  │ ████████░░ 80%   ││
│  │  HIGH     │ Extract Problems  │ Pending  │ Waiting...       ││
│  │  MEDIUM   │ Compute Trends    │ Queued   │ Position: 3      ││
│  │  LOW      │ Update Embeddings │ Queued   │ Position: 7      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### Agent Status Card Component

```typescript
// components/agents/AgentStatusCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

type AgentStatus = "idle" | "running" | "failed" | "awaiting_approval"

interface AgentStatusCardProps {
  agentType: string
  title: string
}

export function AgentStatusCard({ agentType, title }: AgentStatusCardProps) {
  const status = useQuery(api.agentRuns.getLatestStatus, { agentType })
  const todayCount = useQuery(api.agentRuns.countToday, { agentType })
  const pendingTasks = useQuery(api.agentTasks.countPending, { agentType })

  const statusColors: Record<AgentStatus, string> = {
    idle: "bg-gray-500",
    running: "bg-green-500 animate-pulse",
    failed: "bg-red-500",
    awaiting_approval: "bg-yellow-500",
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${statusColors[status?.status || "idle"]}`} />
            <Badge variant="outline">{status?.status || "idle"}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{todayCount || 0} runs today</span>
          {pendingTasks > 0 && (
            <span className="text-yellow-600">{pendingTasks} pending</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### Approval Request Card Component

```typescript
// components/agents/ApprovalRequestCard.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { formatDistanceToNow } from "date-fns"

interface ApprovalRequestCardProps {
  approval: {
    _id: string
    requestId: string
    agentType: string
    description: string
    data: any
    requestedAt: number
  }
}

export function ApprovalRequestCard({ approval }: ApprovalRequestCardProps) {
  const approve = useMutation(api.agentApprovals.approve)
  const reject = useMutation(api.agentApprovals.reject)

  const handleApprove = async () => {
    await approve({ requestId: approval.requestId })
  }

  const handleReject = async () => {
    await reject({ requestId: approval.requestId })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{approval.description}</CardTitle>
          <Badge>{approval.agentType}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          Requested {formatDistanceToNow(approval.requestedAt)} ago
        </div>
        {approval.data?.summary && (
          <p className="mt-2 text-sm">{approval.data.summary}</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleApprove} className="flex-1">
          Approve
        </Button>
        <Button onClick={handleReject} variant="outline" className="flex-1">
          Reject
        </Button>
      </CardFooter>
    </Card>
  )
}
```

#### Task Queue Component

```typescript
// components/agents/TaskQueue.tsx
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const priorityColors = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-gray-500",
}

export function TaskQueue() {
  const tasks = useQuery(api.agentTasks.listActive)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks?.map((task) => (
            <div key={task._id} className="flex items-center gap-4">
              <Badge className={priorityColors[task.priority]}>
                {task.priority.toUpperCase()}
              </Badge>
              <div className="flex-1">
                <div className="text-sm font-medium">{task.agentType}</div>
                <div className="text-xs text-muted-foreground">{task.status}</div>
              </div>
              {task.status === "running" && task.progress && (
                <Progress value={task.progress} className="w-24" />
              )}
            </div>
          ))}
          {(!tasks || tasks.length === 0) && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No active tasks
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### Section 11: Performance Requirements

#### 11.1 Performance Targets

| Metric                   | Target        | Measurement                        |
| ------------------------ | ------------- | ---------------------------------- |
| Page Load Time           | < 2 seconds   | Time to First Contentful Paint     |
| API Response Time        | < 500ms (p95) | Convex query latency               |
| Real-time Update Latency | < 100ms       | Subscription delivery              |
| Paper Processing Time    | < 5 minutes   | End-to-end analysis                |
| Search Results           | < 1 second    | Full-text and vector search        |
| Report Generation        | < 30 seconds  | Full opportunity report            |
| Agent Status Update      | < 200ms       | Real-time via Convex subscriptions |

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
│   ├── agents/                   # Agent monitoring (NEW)
│   │   ├── page.tsx              # Agent dashboard overview
│   │   ├── tasks/
│   │   │   └── page.tsx          # Task queue management
│   │   └── approvals/
│   │       └── page.tsx          # Human-in-the-loop approvals
│   └── settings/
│       └── page.tsx              # User settings
├── api/                          # API routes
│   ├── webhooks/
│   │   └── clerk/route.ts        # Clerk webhooks
│   └── agents/                   # Agent control endpoints (NEW)
│       ├── trigger/route.ts      # Trigger agent tasks
│       ├── status/route.ts       # Get task status
│       ├── approve/route.ts      # Human approval
│       └── cancel/route.ts       # Cancel running task
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
│   ├── progress.tsx
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
├── agents/                       # Agent monitoring components (NEW)
│   ├── AgentDashboard.tsx        # Main dashboard view
│   ├── AgentStatusCard.tsx       # Individual agent status
│   ├── AgentMetrics.tsx          # Aggregate metrics
│   ├── AgentRunHistory.tsx       # Run history table
│   ├── TaskQueue.tsx             # Task queue display
│   ├── TaskCard.tsx              # Individual task card
│   ├── TaskPriorityBadge.tsx     # Priority indicator
│   ├── ApprovalQueue.tsx         # Approval requests list
│   ├── ApprovalRequestCard.tsx   # Individual approval request
│   ├── AgentTypeBadge.tsx        # Agent type indicator
│   └── TriggerAgentDialog.tsx    # Manual trigger dialog
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
    ├── ApprovalNeededNotification.tsx  # NEW
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

### Week 11-12: Agent Monitoring & Real-time

- [ ] Agent Dashboard page with status overview
- [ ] Task Queue page with priority management
- [ ] Approval Queue page with approve/reject actions
- [ ] AgentStatusCard component with real-time updates
- [ ] ApprovalRequestCard component
- [ ] TaskQueue component
- [ ] TriggerAgentDialog for manual triggers
- [ ] Implement all Convex real-time hooks
- [ ] Add real-time update indicators
- [ ] Implement notification system (including approval notifications)
- [ ] Add bookmark functionality
- [ ] Performance optimization
- [ ] Responsive design testing
- [ ] Accessibility audit

---

## React Hooks to Implement

```typescript
// hooks/use-papers.ts
export function usePapers(filters: PaperFilters);
export function usePaper(id: string);
export function usePaperSearch(query: string);

// hooks/use-insights.ts
export function useInsights(filters: InsightFilters);
export function useInsight(id: string);
export function useInsightsByPaper(paperId: string);

// hooks/use-trends.ts
export function useTrends(filters: TrendFilters);
export function useTrend(id: string);
export function useEmergingTrends();

// hooks/use-problems.ts
export function useProblems(filters: ProblemFilters);
export function useProblem(id: string);
export function useProblemsByStartup(startupId: string);
export function useProblemClusters();

// hooks/use-startups.ts
export function useStartups(filters: StartupFilters);
export function useStartup(id: string);
export function useTrackedStartups();

// hooks/use-research-links.ts
export function useResearchLinks(filters: LinkFilters);
export function useResearchLink(id: string);
export function useResearchLinksByProblem(problemId: string);
export function useResearchLinksByPaper(paperId: string);

// hooks/use-solution-reports.ts
export function useSolutionReport(problemId: string);

// hooks/use-bookmarks.ts
export function useBookmarks();
export function useAddBookmark();
export function useRemoveBookmark();

// hooks/use-user.ts
export function useCurrentUser();
export function useUpdatePreferences();

// hooks/use-agents.ts (NEW)
export function useAgentStatus(agentType: string);
export function useAgentRuns(agentType?: string);
export function useAgentRunHistory(filters: RunFilters);

// hooks/use-agent-tasks.ts (NEW)
export function useAgentTasks(filters?: TaskFilters);
export function usePendingTasks();
export function useRunningTasks();
export function useTriggerTask();
export function useCancelTask();

// hooks/use-agent-approvals.ts (NEW)
export function usePendingApprovals();
export function useApprovalCount();
export function useApproveRequest();
export function useRejectRequest();
```

---

## API Routes for Agent Control (NEW)

```typescript
// app/api/agents/trigger/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { agentType, payload, priority } = await request.json();

  // Validate agent type
  const validTypes = [
    "research_discovery",
    "problem_discovery",
    "research_linking",
    "trend_analysis",
    "insight_generation",
  ];

  if (!validTypes.includes(agentType)) {
    return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
  }

  // Create task in Convex
  // Trigger LangGraph workflow

  return NextResponse.json({ taskId: "..." });
}

// app/api/agents/status/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");

  // Query task status from Convex

  return NextResponse.json({ status: "...", progress: "..." });
}

// app/api/agents/approve/route.ts
export async function POST(request: Request) {
  const { requestId, decision, notes } = await request.json();

  // Update approval in Convex
  // Resume LangGraph workflow if approved

  return NextResponse.json({ success: true });
}

// app/api/agents/cancel/route.ts
export async function POST(request: Request) {
  const { taskId } = await request.json();

  // Cancel running task
  // Update status in Convex

  return NextResponse.json({ success: true });
}
```

---

## Verification Criteria

- [ ] All 11 pages render correctly (including 3 new agent pages)
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
- [ ] Agent status updates in real-time
- [ ] Task queue shows current tasks with progress
- [ ] Approval queue allows approve/reject actions
- [ ] Manual agent trigger works correctly
- [ ] Notifications appear for pending approvals
