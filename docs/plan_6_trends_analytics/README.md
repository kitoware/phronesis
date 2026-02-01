# Plan 6: Trends & Analytics

**Timeline:** Weeks 25-28 (parallel)
**Dependencies:** plan_1 (Foundation & Scaffolding)
**Uses Data From:** plan_3 (Research Agent)
**Parallel With:** plan_2, plan_3, plan_4, plan_5

---

## Overview

This plan implements the trend detection system, analytics dashboards, and success metrics tracking for the ArXiv Research Intelligence Platform.

---

## Scope

- Trend detection system
- Signal extraction (TF-IDF, KeyBERT)
- Topic clustering (BERTopic, LDA)
- Trend visualization (Recharts, D3.js)
- Success metrics tracking
- Analytics dashboard

---

## Key Deliverables

1. Trend detection system (RDA-005)
2. Signal extraction pipeline (keywords, topics, entities)
3. Trend metrics computation (growth rate, momentum, etc.)
4. Trend classification (emerging, growing, stable, declining, breakthrough)
5. Trend visualization components
6. Convex functions: trends
7. Analytics dashboard with KPIs

---

## Git Worktree Setup

```bash
# Create worktree from main after plan_1 is complete
git worktree add ../phronesis-trends feature/trends-analytics
cd ../phronesis-trends
```

---

## PRD Sections Extracted

### Section 5.1.6: Trend Detection System

**Feature ID:** RDA-005
**Priority:** P1 (High)
**Complexity:** High

**Description:** Identify emerging research trends, declining areas, and breakthrough patterns across the paper corpus.

**Trend Computation:**

1. **Signal Extraction**
   - Keyword extraction (TF-IDF, KeyBERT)
   - Topic modeling (BERTopic, LDA)
   - Entity recognition (methods, datasets, metrics)
   - Citation network analysis
   - Temporal binning

2. **Trend Metrics**
   - Growth rate (paper count delta)
   - Momentum (velocity of change)
   - Author participation
   - Cross-category emergence
   - Citation acceleration

3. **Classification**
   - Emerging: >50% growth, low base
   - Growing: 20-50% sustained growth
   - Stable: <20% change
   - Declining: Negative growth
   - Breakthrough: Sudden spike (>100%)

**Trends Schema:**

```typescript
// convex/schema.ts - Trends schema
trends: defineTable({
  trendId: v.string(),
  name: v.string(),
  description: v.string(),
  status: v.string(),  // emerging, growing, stable, declining, breakthrough
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
```

---

### Section 7.1 API: Trends

```typescript
// Trends API
api.trends.list              // List all trends
api.trends.get               // Get single trend
api.trends.emerging          // Get emerging trends
api.trends.declining         // Get declining trends
api.trends.breakthrough      // Get breakthrough trends
api.trends.byCategory        // Filter by category
api.trends.search            // Search trends by keyword
api.trends.timeSeries        // Get trend time series data
api.trends.forecast          // Get trend forecast
```

---

### Section 13: Success Metrics & KPIs

#### 13.1 Key Performance Indicators

**Product Metrics:**

| Metric | Target (Y1) | Measurement |
|--------|-------------|-------------|
| Papers processed/day | 100+ | Agent run logs |
| Insights generated/day | 80+ | Database counts |
| Startup problems discovered/day | 50+ | Database counts |
| Research-problem links/day | 100+ | Database counts |
| Problem discovery accuracy | 85% | Expert review |
| Research link relevance | 80% | User validation |
| Startups tracked | 5,000+ | Database counts |
| Time to problem discovery | < 1 hour | Processing timestamps |

**User Engagement Metrics:**

| Metric | Target (Y1) | Measurement |
|--------|-------------|-------------|
| DAU | 1,000 | Analytics |
| Session duration | > 8 minutes | Analytics |
| Papers viewed/session | > 5 | Event tracking |
| Bookmarks/user/month | > 10 | Database counts |
| Return rate (7-day) | > 40% | Cohort analysis |

**Business Metrics:**

| Metric | Target (Y1) | Target (Y2) |
|--------|-------------|-------------|
| Registered users | 5,000 | 25,000 |
| Paid subscribers | 500 | 3,000 |
| MRR | $25,000 | $150,000 |
| Churn rate (monthly) | < 5% | < 3% |
| NPS score | > 40 | > 50 |

---

### Section 14: Risks & Mitigations

#### 14.1 Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| arXiv API changes/downtime | Medium | High | Caching, fallback to RSS, monitoring |
| LLM hallucinations | Medium | High | Human review sample, confidence scoring |
| High API costs | Medium | Medium | Token budgeting, caching, model selection |
| Data quality issues | Medium | Medium | PDF quality scoring, retry mechanisms |
| Scaling bottlenecks | Low | High | Convex auto-scaling, monitoring |
| User adoption challenges | Medium | High | User research, onboarding, marketing |
| Twitter/X API restrictions | High | High | Multi-platform fallback, rate limit optimization |
| Reddit API changes/costs | Medium | Medium | OAuth app, caching, alternative sources |
| Startup data accuracy | Medium | Medium | Multiple source validation, user corrections |
| Problem-research match quality | Medium | High | User validation loop, confidence thresholds |
| Social content noise | High | Medium | Advanced filtering, LLM-based relevance scoring |
| Privacy/data compliance | Low | High | Only public data, clear data policies |

---

## Trend Detection Algorithm

### Signal Extraction Pipeline

```typescript
interface TrendSignal {
  keywords: string[];
  topics: Topic[];
  entities: Entity[];
  citations: CitationMetrics;
  temporal: TemporalMetrics;
}

async function extractSignals(papers: Paper[]): Promise<TrendSignal> {
  // 1. Keyword extraction using TF-IDF and KeyBERT
  const keywords = await extractKeywords(papers);

  // 2. Topic modeling using BERTopic
  const topics = await extractTopics(papers);

  // 3. Entity recognition (methods, datasets, metrics)
  const entities = await extractEntities(papers);

  // 4. Citation network analysis
  const citations = await analyzeCitations(papers);

  // 5. Temporal binning (weekly/monthly)
  const temporal = await computeTemporalMetrics(papers);

  return { keywords, topics, entities, citations, temporal };
}
```

### Trend Metrics Computation

```typescript
interface TrendMetrics {
  paperCount: number;
  paperCountPrevPeriod: number;
  growthRate: number;
  momentum: number;
  authorCount: number;
  avgCitations: number;
  crossCategoryScore: number;
  trendScore: number;
}

function computeTrendMetrics(
  currentPapers: Paper[],
  previousPapers: Paper[],
  allPapers: Paper[]
): TrendMetrics {
  const paperCount = currentPapers.length;
  const paperCountPrevPeriod = previousPapers.length;

  // Growth rate: (current - previous) / previous
  const growthRate = paperCountPrevPeriod > 0
    ? (paperCount - paperCountPrevPeriod) / paperCountPrevPeriod
    : paperCount > 0 ? 1 : 0;

  // Momentum: rate of change of growth rate
  const momentum = computeMomentum(allPapers);

  // Author participation
  const authorCount = new Set(currentPapers.flatMap(p => p.authors.map(a => a.name))).size;

  // Average citations
  const avgCitations = currentPapers.reduce((sum, p) => sum + (p.citationCount || 0), 0) / paperCount;

  // Cross-category emergence
  const crossCategoryScore = computeCrossCategoryScore(currentPapers);

  // Composite trend score
  const trendScore = computeTrendScore({
    growthRate,
    momentum,
    authorCount,
    avgCitations,
    crossCategoryScore
  });

  return {
    paperCount,
    paperCountPrevPeriod,
    growthRate,
    momentum,
    authorCount,
    avgCitations,
    crossCategoryScore,
    trendScore
  };
}
```

### Trend Classification

```typescript
type TrendStatus = 'emerging' | 'growing' | 'stable' | 'declining' | 'breakthrough';

function classifyTrend(metrics: TrendMetrics): TrendStatus {
  const { growthRate, paperCount, momentum } = metrics;

  // Breakthrough: sudden spike (>100% growth)
  if (growthRate > 1.0 && momentum > 0.5) {
    return 'breakthrough';
  }

  // Emerging: >50% growth with low base
  if (growthRate > 0.5 && paperCount < 100) {
    return 'emerging';
  }

  // Growing: 20-50% sustained growth
  if (growthRate >= 0.2 && growthRate <= 0.5) {
    return 'growing';
  }

  // Declining: negative growth
  if (growthRate < 0) {
    return 'declining';
  }

  // Stable: <20% change
  return 'stable';
}
```

---

## Analytics Dashboard

### Dashboard Metrics

```typescript
interface DashboardMetrics {
  // Paper processing
  papersProcessedToday: number;
  papersProcessedThisWeek: number;
  papersProcessedTotal: number;
  processingSuccessRate: number;

  // Insights
  insightsGeneratedToday: number;
  avgInsightConfidence: number;

  // Problems
  problemsDiscoveredToday: number;
  problemsDiscoveredThisWeek: number;
  avgProblemSeverity: number;

  // Research Links
  linksCreatedToday: number;
  avgMatchScore: number;
  validationRate: number;

  // User engagement
  activeUsersToday: number;
  avgSessionDuration: number;
  bookmarksCreatedToday: number;

  // Trends
  emergingTrendsCount: number;
  breakthroughsThisMonth: number;
}
```

### Visualization Components

```typescript
// components/analytics/
├── MetricsSummary.tsx        // Key metrics cards
├── ProcessingChart.tsx       // Papers processed over time
├── InsightQualityChart.tsx   // Insight confidence distribution
├── ProblemDiscoveryChart.tsx // Problems discovered over time
├── LinkQualityChart.tsx      // Match score distribution
├── UserEngagementChart.tsx   // DAU, session duration
├── TrendOverview.tsx         // Trend status distribution
├── TrendTimeline.tsx         // Trend growth over time
└── RiskMonitor.tsx           // Risk indicators and alerts
```

---

## Implementation Checklist

### Week 25: Signal Extraction
- [ ] Implement TF-IDF keyword extraction
- [ ] Integrate KeyBERT for semantic keywords
- [ ] Implement BERTopic for topic modeling
- [ ] Create entity recognition pipeline
- [ ] Build citation network analyzer
- [ ] Implement temporal binning

### Week 26: Trend Computation
- [ ] Implement growth rate calculation
- [ ] Create momentum computation
- [ ] Build cross-category analysis
- [ ] Implement trend classification
- [ ] Create trend forecasting
- [ ] Build related trends detection

### Week 27: Visualization
- [ ] Create trend overview page
- [ ] Implement trend detail view
- [ ] Build trend charts (Recharts)
- [ ] Create trend timeline visualization
- [ ] Implement trend comparison view
- [ ] Build trend search and filters

### Week 28: Analytics Dashboard
- [ ] Create metrics summary cards
- [ ] Build processing charts
- [ ] Implement user engagement tracking
- [ ] Create risk monitoring dashboard
- [ ] Build KPI tracking system
- [ ] Implement alerts for anomalies

---

## Convex Functions to Implement

```typescript
// convex/trends.ts
export const list = query(...)
export const get = query(...)
export const emerging = query(...)
export const declining = query(...)
export const breakthrough = query(...)
export const byCategory = query(...)
export const search = query(...)
export const timeSeries = query(...)
export const forecast = query(...)
export const create = mutation(...)
export const update = mutation(...)

// convex/analytics.ts
export const getDashboardMetrics = query(...)
export const getPaperProcessingStats = query(...)
export const getInsightQualityStats = query(...)
export const getProblemDiscoveryStats = query(...)
export const getLinkQualityStats = query(...)
export const getUserEngagementStats = query(...)
export const getTrendStats = query(...)
export const getRiskIndicators = query(...)

// convex/agents/trends.ts
export const compute = action(...)
export const extractSignals = action(...)
export const classifyTrends = action(...)
export const updateForecasts = action(...)
export const detectBreakthroughs = action(...)

// convex/crons.ts
crons.interval("compute-trends", { hours: 6 }, internal.agents.trends.compute)
crons.interval("update-analytics", { hours: 1 }, internal.analytics.refresh)
```

---

## Trend Visualization Specs

### Trend Overview Chart

```typescript
// Recharts configuration for trend overview
const TrendOverviewChart = () => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={trendTimeSeries}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="emerging"
          stackId="1"
          fill="#10b981"
        />
        <Area
          type="monotone"
          dataKey="growing"
          stackId="1"
          fill="#3b82f6"
        />
        <Area
          type="monotone"
          dataKey="stable"
          stackId="1"
          fill="#6b7280"
        />
        <Area
          type="monotone"
          dataKey="declining"
          stackId="1"
          fill="#ef4444"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
```

### Trend Detail Card

```typescript
interface TrendCardProps {
  trend: Trend;
  showTimeSeries?: boolean;
}

const TrendCard = ({ trend, showTimeSeries }: TrendCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{trend.name}</CardTitle>
          <StatusBadge status={trend.status} />
        </div>
        <CardDescription>{trend.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <MetricDisplay
            label="Papers"
            value={trend.metrics.paperCount}
          />
          <MetricDisplay
            label="Growth"
            value={`${(trend.metrics.growthRate * 100).toFixed(1)}%`}
            trend={trend.metrics.growthRate > 0 ? 'up' : 'down'}
          />
          <MetricDisplay
            label="Authors"
            value={trend.metrics.authorCount}
          />
        </div>
        {showTimeSeries && (
          <MiniTrendChart data={trend.timeSeries} />
        )}
      </CardContent>
      <CardFooter>
        <div className="flex flex-wrap gap-2">
          {trend.keywords.slice(0, 5).map(keyword => (
            <Badge key={keyword} variant="outline">{keyword}</Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};
```

---

## Verification Criteria

- [ ] Signal extraction produces meaningful keywords
- [ ] Topic modeling creates coherent clusters
- [ ] Trend metrics compute correctly
- [ ] Classification aligns with manual review
- [ ] Forecasts have >70% directional accuracy
- [ ] Trend charts render correctly
- [ ] Analytics dashboard loads in <2 seconds
- [ ] All KPIs track correctly
- [ ] Risk indicators trigger appropriately
- [ ] Trend computation completes in <30 minutes
