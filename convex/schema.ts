import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // PAPERS & RESEARCH CONTENT
  // ============================================

  papers: defineTable({
    arxivId: v.string(),
    title: v.string(),
    abstract: v.string(),
    authors: v.array(
      v.object({
        name: v.string(),
        affiliations: v.optional(v.array(v.string())),
      })
    ),
    categories: v.array(v.string()),
    primaryCategory: v.string(),
    publishedDate: v.string(),
    updatedDate: v.optional(v.string()),
    pdfUrl: v.string(),
    doi: v.optional(v.string()),
    journalRef: v.optional(v.string()),
    comments: v.optional(v.string()),
    processingStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    processingError: v.optional(v.string()),
    fetchedAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_arxiv_id", ["arxivId"])
    .index("by_processing_status", ["processingStatus"])
    .index("by_primary_category", ["primaryCategory"])
    .index("by_published_date", ["publishedDate"])
    .searchIndex("search_papers", {
      searchField: "title",
      filterFields: ["primaryCategory", "processingStatus"],
    }),

  paperContent: defineTable({
    paperId: v.id("papers"),
    fullText: v.optional(v.string()),
    sections: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
        level: v.number(),
      })
    ),
    figures: v.array(
      v.object({
        caption: v.string(),
        reference: v.string(),
        pageNumber: v.optional(v.number()),
      })
    ),
    tables: v.array(
      v.object({
        caption: v.string(),
        content: v.string(),
        reference: v.string(),
      })
    ),
    equations: v.array(
      v.object({
        latex: v.string(),
        reference: v.optional(v.string()),
        context: v.optional(v.string()),
      })
    ),
    references: v.array(
      v.object({
        title: v.optional(v.string()),
        authors: v.optional(v.array(v.string())),
        year: v.optional(v.string()),
        venue: v.optional(v.string()),
        doi: v.optional(v.string()),
        arxivId: v.optional(v.string()),
      })
    ),
    extractedAt: v.number(),
  }).index("by_paper", ["paperId"]),

  // ============================================
  // INSIGHTS & ANALYSIS
  // ============================================

  insights: defineTable({
    paperId: v.id("papers"),
    summary: v.string(),
    keyFindings: v.array(v.string()),
    methodology: v.string(),
    limitations: v.array(v.string()),
    futureWork: v.array(v.string()),
    technicalContributions: v.array(
      v.object({
        type: v.string(),
        description: v.string(),
        significance: v.union(
          v.literal("incremental"),
          v.literal("notable"),
          v.literal("significant"),
          v.literal("breakthrough")
        ),
      })
    ),
    practicalApplications: v.array(v.string()),
    targetAudience: v.array(v.string()),
    prerequisites: v.array(v.string()),
    embedding: v.array(v.float64()),
    analysisVersion: v.string(),
    analyzedAt: v.number(),
  })
    .index("by_paper", ["paperId"])
    .vectorIndex("vector_insights", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: [],
    }),

  diagrams: defineTable({
    paperId: v.id("papers"),
    insightId: v.optional(v.id("insights")),
    type: v.union(
      v.literal("architecture"),
      v.literal("flowchart"),
      v.literal("sequence"),
      v.literal("comparison"),
      v.literal("timeline"),
      v.literal("mindmap"),
      v.literal("custom")
    ),
    title: v.string(),
    description: v.string(),
    mermaidCode: v.optional(v.string()),
    d3Config: v.optional(v.string()),
    svgContent: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_paper", ["paperId"])
    .index("by_insight", ["insightId"]),

  // ============================================
  // TRENDS & ANALYTICS
  // ============================================

  trends: defineTable({
    category: v.string(),
    topic: v.string(),
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly")
    ),
    startDate: v.string(),
    endDate: v.string(),
    metrics: v.object({
      paperCount: v.number(),
      citationVelocity: v.optional(v.number()),
      authorCount: v.number(),
      institutionCount: v.number(),
      growthRate: v.optional(v.number()),
    }),
    timeSeries: v.array(
      v.object({
        date: v.string(),
        value: v.number(),
      })
    ),
    topPapers: v.array(v.id("papers")),
    topAuthors: v.array(v.string()),
    relatedTopics: v.array(v.string()),
    forecast: v.optional(
      v.object({
        nextPeriodEstimate: v.number(),
        confidence: v.number(),
        trend: v.union(
          v.literal("rising"),
          v.literal("stable"),
          v.literal("declining")
        ),
      })
    ),
    computedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_topic", ["topic"])
    .index("by_period", ["period", "startDate"]),

  // ============================================
  // STARTUPS & PROBLEMS
  // ============================================

  startups: defineTable({
    name: v.string(),
    description: v.string(),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    crunchbaseUrl: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
    headquartersLocation: v.optional(v.string()),
    employeeCount: v.optional(
      v.union(
        v.literal("1-10"),
        v.literal("11-50"),
        v.literal("51-200"),
        v.literal("201-500"),
        v.literal("501-1000"),
        v.literal("1000+")
      )
    ),
    fundingStage: v.optional(
      v.union(
        v.literal("pre-seed"),
        v.literal("seed"),
        v.literal("series-a"),
        v.literal("series-b"),
        v.literal("series-c"),
        v.literal("series-d+"),
        v.literal("public"),
        v.literal("acquired")
      )
    ),
    totalFunding: v.optional(v.number()),
    industries: v.array(v.string()),
    technologies: v.array(v.string()),
    sourceType: v.union(
      v.literal("manual"),
      v.literal("crunchbase"),
      v.literal("linkedin"),
      v.literal("other")
    ),
    sourceUrl: v.optional(v.string()),
    lastUpdated: v.number(),
    createdAt: v.number(),
  })
    .index("by_funding_stage", ["fundingStage"])
    .index("by_founded_year", ["foundedYear"])
    .searchIndex("search_startups", {
      searchField: "name",
      filterFields: ["fundingStage", "industries"],
    }),

  startupProblems: defineTable({
    startupId: v.id("startups"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("technical"),
      v.literal("operational"),
      v.literal("market"),
      v.literal("product"),
      v.literal("scaling"),
      v.literal("other")
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    status: v.union(
      v.literal("identified"),
      v.literal("researching"),
      v.literal("solution-found"),
      v.literal("resolved"),
      v.literal("archived")
    ),
    evidence: v.array(
      v.object({
        source: v.string(),
        excerpt: v.string(),
        date: v.optional(v.string()),
        url: v.optional(v.string()),
      })
    ),
    tags: v.array(v.string()),
    embedding: v.array(v.float64()),
    discoveredAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_startup", ["startupId"])
    .index("by_category", ["category"])
    .index("by_severity", ["severity"])
    .index("by_status", ["status"])
    .vectorIndex("vector_problems", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["category", "severity", "status"],
    }),

  founders: defineTable({
    name: v.string(),
    linkedinUrl: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    bio: v.optional(v.string()),
    startupIds: v.array(v.id("startups")),
    expertise: v.array(v.string()),
    education: v.array(
      v.object({
        institution: v.string(),
        degree: v.optional(v.string()),
        field: v.optional(v.string()),
        year: v.optional(v.number()),
      })
    ),
    previousCompanies: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_startup", ["startupIds"])
    .searchIndex("search_founders", {
      searchField: "name",
      filterFields: [],
    }),

  implicitSignals: defineTable({
    startupId: v.id("startups"),
    problemId: v.optional(v.id("startupProblems")),
    signalType: v.union(
      v.literal("job-posting"),
      v.literal("blog-post"),
      v.literal("social-media"),
      v.literal("press-release"),
      v.literal("funding-announcement"),
      v.literal("partnership"),
      v.literal("product-update"),
      v.literal("other")
    ),
    title: v.string(),
    content: v.string(),
    sourceUrl: v.string(),
    publishedAt: v.optional(v.string()),
    inferredIntent: v.optional(v.string()),
    confidence: v.number(),
    keywords: v.array(v.string()),
    detectedAt: v.number(),
  })
    .index("by_startup", ["startupId"])
    .index("by_problem", ["problemId"])
    .index("by_signal_type", ["signalType"]),

  // ============================================
  // RESEARCH LINKS & SOLUTIONS
  // ============================================

  researchLinks: defineTable({
    problemId: v.id("startupProblems"),
    paperId: v.id("papers"),
    insightId: v.optional(v.id("insights")),
    relevanceScore: v.number(),
    matchType: v.union(
      v.literal("direct"),
      v.literal("methodology"),
      v.literal("tangential"),
      v.literal("inspiration")
    ),
    matchRationale: v.string(),
    keyInsights: v.array(v.string()),
    applicationSuggestions: v.array(v.string()),
    confidence: v.number(),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewStatus: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("needs-review")
    ),
    reviewNotes: v.optional(v.string()),
  })
    .index("by_problem", ["problemId"])
    .index("by_paper", ["paperId"])
    .index("by_relevance", ["relevanceScore"])
    .index("by_review_status", ["reviewStatus"]),

  solutionReports: defineTable({
    problemId: v.id("startupProblems"),
    title: v.string(),
    executiveSummary: v.string(),
    sections: v.array(
      v.object({
        title: v.string(),
        content: v.string(),
        citations: v.array(v.id("papers")),
      })
    ),
    recommendations: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        priority: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high")
        ),
        effort: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high")
        ),
        relatedPapers: v.array(v.id("papers")),
      })
    ),
    linkedResearch: v.array(v.id("researchLinks")),
    generatedAt: v.number(),
    version: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
  })
    .index("by_problem", ["problemId"])
    .index("by_status", ["status"]),

  // ============================================
  // USERS & PREFERENCES
  // ============================================

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin")),
    preferences: v.object({
      defaultCategories: v.array(v.string()),
      emailDigest: v.boolean(),
      digestFrequency: v.optional(
        v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
      ),
      theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
    }),
    onboardingCompleted: v.boolean(),
    lastActiveAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  bookmarks: defineTable({
    userId: v.id("users"),
    itemType: v.union(
      v.literal("paper"),
      v.literal("insight"),
      v.literal("startup"),
      v.literal("problem"),
      v.literal("solution")
    ),
    itemId: v.string(),
    notes: v.optional(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "itemType"])
    .index("by_item", ["itemType", "itemId"]),

  // ============================================
  // AGENT EXECUTION
  // ============================================

  agentRuns: defineTable({
    agentType: v.union(
      v.literal("research-ingestion"),
      v.literal("insight-generation"),
      v.literal("trend-analysis"),
      v.literal("problem-discovery"),
      v.literal("research-linking"),
      v.literal("solution-synthesis")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    triggeredBy: v.union(
      v.literal("scheduled"),
      v.literal("manual"),
      v.literal("webhook"),
      v.literal("dependency")
    ),
    input: v.optional(v.any()),
    output: v.optional(v.any()),
    error: v.optional(
      v.object({
        message: v.string(),
        stack: v.optional(v.string()),
        code: v.optional(v.string()),
      })
    ),
    metrics: v.optional(
      v.object({
        duration: v.number(),
        itemsProcessed: v.number(),
        tokensUsed: v.optional(v.number()),
        apiCalls: v.optional(v.number()),
      })
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_agent_type", ["agentType"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Task queue for agent work items
  agentTasks: defineTable({
    taskType: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("critical")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    payload: v.any(),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    maxRetries: v.number(),
    retryCount: v.number(),
    assignedTo: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_priority_status", ["priority", "status"])
    .index("by_task_type", ["taskType"])
    .index("by_scheduled", ["scheduledFor"]),

  // LangGraph state persistence for checkpoints
  agentCheckpoints: defineTable({
    threadId: v.string(),
    checkpointId: v.string(),
    parentCheckpointId: v.optional(v.string()),
    state: v.any(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_thread", ["threadId"])
    .index("by_checkpoint", ["checkpointId"])
    .index("by_thread_and_checkpoint", ["threadId", "checkpointId"]),

  // Human-in-the-loop approval requests
  agentApprovals: defineTable({
    requestId: v.string(),
    agentRunId: v.optional(v.id("agentRuns")),
    taskId: v.optional(v.id("agentTasks")),
    approvalType: v.union(
      v.literal("action"),
      v.literal("output"),
      v.literal("decision"),
      v.literal("escalation")
    ),
    title: v.string(),
    description: v.string(),
    context: v.optional(v.any()),
    options: v.optional(
      v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          description: v.optional(v.string()),
        })
      )
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    resolution: v.optional(
      v.object({
        selectedOption: v.optional(v.string()),
        comment: v.optional(v.string()),
        resolvedBy: v.optional(v.string()),
        resolvedAt: v.number(),
      })
    ),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_request_id", ["requestId"])
    .index("by_status", ["status"])
    .index("by_agent_run", ["agentRunId"])
    .index("by_task", ["taskId"]),

  // Persistent key-value cache with TTL
  agentCache: defineTable({
    key: v.string(),
    namespace: v.string(),
    value: v.any(),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["namespace", "key"])
    .index("by_expires", ["expiresAt"]),
});
