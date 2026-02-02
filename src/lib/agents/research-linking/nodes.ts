import { createLLM } from "../shared/llm";
import { generateEmbedding } from "../shared/embeddings";
import {
  createConvexClient,
  api,
  type Id,
  type Doc,
} from "../shared/convex-client";
import type {
  ResearchLinkingStateType,
  InsightWithScore,
  InsightWithPaper,
} from "./state";
import {
  computeOverallScore,
  determineMatchType,
  SCORING_PROMPT_TEMPLATE,
  REPORT_GENERATION_PROMPT,
  CONFIG,
  LLMScoreResponseSchema,
  LLMReportResponseSchema,
  parseLLMResponse,
  sanitizeForPrompt,
  type CandidateMatch,
} from "./scoring";

/**
 * Node: Load problem from Convex by ID
 */
export async function loadProblem(
  state: ResearchLinkingStateType
): Promise<Partial<ResearchLinkingStateType>> {
  const client = createConvexClient();

  try {
    const problem = await client.query(api.problems.getById, {
      id: state.problemId,
    });

    if (!problem) {
      return {
        error: `Problem not found: ${state.problemId}`,
      };
    }

    // Update agent run status to running
    await client.mutation(api.agentRuns.start, {
      id: state.runId,
    });

    return { problem };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load problem";
    return { error: message };
  }
}

/**
 * Node: Find candidate insights using vector search
 */
export async function findCandidates(
  state: ResearchLinkingStateType
): Promise<Partial<ResearchLinkingStateType>> {
  if (state.error || !state.problem) {
    return {};
  }

  const client = createConvexClient();

  try {
    // Generate embedding from problem description
    const problemText = `${state.problem.title}\n\n${state.problem.description}`;
    const embedding = await generateEmbedding(problemText);

    // Search for similar insights
    const insights = (await client.action(api.insights.searchSimilar, {
      embedding,
      limit: CONFIG.VECTOR_SEARCH_LIMIT,
    })) as InsightWithScore[];

    if (insights.length === 0) {
      return {
        candidates: [],
      };
    }

    // Fetch corresponding papers for each insight, filtering out null papers
    const insightsWithPapers = (
      await Promise.all(
        insights.map(async (insight) => {
          const paper = await client.query(api.papers.getById, {
            id: insight.paperId,
          });
          if (!paper) return null;
          return { insight, paper };
        })
      )
    ).filter((item): item is InsightWithPaper => item !== null);

    // Filter out any with missing papers
    const validInsights = insightsWithPapers;

    // Convert to initial candidate format (scores will be filled by scoreMatches)
    const candidates: CandidateMatch[] = validInsights.map((item) => ({
      insightId: item.insight._id,
      paperId: item.paper._id,
      paperTitle: item.paper.title,
      insightSummary: item.insight.summary,
      vectorSimilarity: item.insight._score,
      scores: {
        technicalFit: 0,
        trlGap: 0,
        timeToValue: 0,
        novelty: 0,
        evidenceStrength: 0,
      },
      overallScore: 0,
      matchType: "inspiration" as const,
      matchRationale: "",
      keyInsights: [],
      applicationSuggestions: [],
    }));

    return { candidates };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to find candidates";
    return { error: message };
  }
}

/**
 * Node: Score matches using LLM
 */
export async function scoreMatches(
  state: ResearchLinkingStateType
): Promise<Partial<ResearchLinkingStateType>> {
  if (state.error || !state.problem || state.candidates.length === 0) {
    return {};
  }

  const client = createConvexClient();
  const llm = createLLM({ temperature: 0.2 });
  const problem = state.problem;

  try {
    const scoredCandidates: CandidateMatch[] = [];

    // Score each candidate (in parallel batches)
    for (let i = 0; i < state.candidates.length; i += CONFIG.LLM_BATCH_SIZE) {
      const batch = state.candidates.slice(i, i + CONFIG.LLM_BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (candidate: CandidateMatch) => {
          // Fetch full insight for detailed scoring
          const insight = await client.query(api.insights.getByPaperId, {
            paperId: candidate.paperId,
          });

          if (!insight) {
            return null;
          }

          // Build prompt with sanitized inputs
          const prompt = SCORING_PROMPT_TEMPLATE.replace(
            "{problemTitle}",
            sanitizeForPrompt(problem.title)
          )
            .replace(
              "{problemDescription}",
              sanitizeForPrompt(problem.description)
            )
            .replace("{problemCategory}", problem.category)
            .replace("{problemSeverity}", problem.severity)
            .replace("{paperTitle}", sanitizeForPrompt(candidate.paperTitle))
            .replace(
              "{paperAbstract}",
              sanitizeForPrompt(candidate.insightSummary)
            )
            .replace("{insightSummary}", sanitizeForPrompt(insight.summary))
            .replace(
              "{keyFindings}",
              sanitizeForPrompt(insight.keyFindings.join("\n- "))
            )
            .replace("{methodology}", sanitizeForPrompt(insight.methodology))
            .replace(
              "{practicalApplications}",
              sanitizeForPrompt(insight.practicalApplications.join("\n- "))
            );

          // Call LLM
          const response = await llm.invoke(prompt);
          const content =
            typeof response.content === "string"
              ? response.content
              : JSON.stringify(response.content);

          // Parse and validate LLM response using Zod schema
          const parsed = parseLLMResponse(content, LLMScoreResponseSchema);
          if (!parsed) {
            return null;
          }

          const overallScore = computeOverallScore(parsed.scores);
          const matchType = determineMatchType(parsed.scores.technicalFit);

          return {
            ...candidate,
            scores: parsed.scores,
            overallScore,
            matchType,
            matchRationale: parsed.matchRationale,
            keyInsights: parsed.keyInsights,
            applicationSuggestions: parsed.applicationSuggestions,
          };
        })
      );

      // Filter out failed scoring attempts
      const validResults = batchResults.filter(
        (r: CandidateMatch | null): r is CandidateMatch => r !== null
      );
      scoredCandidates.push(...validResults);
    }

    // Sort by overall score descending
    scoredCandidates.sort((a, b) => b.overallScore - a.overallScore);

    // Keep top candidates
    const topCandidates = scoredCandidates.slice(
      0,
      CONFIG.TOP_CANDIDATES_LIMIT
    );

    return { candidates: topCandidates };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to score matches";
    return { error: message };
  }
}

/**
 * Node: Save links to Convex with needs-review status
 */
export async function saveLinks(
  state: ResearchLinkingStateType
): Promise<Partial<ResearchLinkingStateType>> {
  if (state.error || !state.problem || state.candidates.length === 0) {
    return { needsApproval: false };
  }

  const client = createConvexClient();

  try {
    const createdLinkIds: Id<"researchLinks">[] = [];

    // Create research links for each candidate
    for (const candidate of state.candidates) {
      const linkId = await client.mutation(api.researchLinks.create, {
        problemId: state.problemId,
        paperId: candidate.paperId,
        insightId: candidate.insightId,
        relevanceScore: candidate.overallScore,
        matchType: candidate.matchType,
        matchRationale: candidate.matchRationale,
        keyInsights: candidate.keyInsights,
        applicationSuggestions: candidate.applicationSuggestions,
        confidence: candidate.vectorSimilarity,
      });

      // Update review status to needs-review
      await client.mutation(api.researchLinks.updateReview, {
        id: linkId,
        reviewStatus: "needs-review",
      });

      createdLinkIds.push(linkId);
    }

    // Update problem status to researching
    await client.mutation(api.problems.updateStatus, {
      id: state.problemId,
      status: "researching",
    });

    // Update agent run with intermediate state
    await client.mutation(api.agentRuns.updateOutput, {
      id: state.runId,
      output: {
        status: "awaiting-approval",
        linksCreated: createdLinkIds.length,
        linkIds: createdLinkIds,
      },
    });

    return {
      createdLinkIds,
      needsApproval: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save links";
    return { error: message };
  }
}

/**
 * Node: Generate solution report from approved links
 */
export async function generateReport(
  state: ResearchLinkingStateType
): Promise<Partial<ResearchLinkingStateType>> {
  if (state.error || !state.problem || state.approvedLinkIds.length === 0) {
    return {};
  }

  const client = createConvexClient();
  const llm = createLLM({
    temperature: 0.4,
    maxTokens: CONFIG.REPORT_MAX_TOKENS,
  });
  const problem = state.problem;

  try {
    // Fetch approved links with their papers
    type LinkData = {
      link: Doc<"researchLinks">;
      paper: Doc<"papers">;
      insight: Doc<"insights"> | null;
    };

    const linksData = await Promise.all(
      state.approvedLinkIds.map(async (linkId: Id<"researchLinks">) => {
        const link = await client.query(api.researchLinks.getById, {
          id: linkId,
        });
        if (!link) return null;

        const paper = await client.query(api.papers.getById, {
          id: link.paperId,
        });
        if (!paper) return null;

        const insight = link.insightId
          ? await client.query(api.insights.getByPaperId, {
              paperId: link.paperId,
            })
          : null;

        return { link, paper, insight };
      })
    );

    const validLinks = linksData.filter((d): d is LinkData => d !== null);

    if (validLinks.length === 0) {
      return { error: "No valid approved links found" };
    }

    // Build research links summary for prompt
    const researchLinksSummary = validLinks
      .map(
        (item: LinkData, idx: number) =>
          `### Link ${idx + 1}: ${item.paper.title}
Match Type: ${item.link.matchType}
Relevance Score: ${(item.link.relevanceScore * 100).toFixed(1)}%
Rationale: ${item.link.matchRationale}
Key Insights: ${item.link.keyInsights.join(", ")}
Application Suggestions: ${item.link.applicationSuggestions.join(", ")}
${item.insight ? `Summary: ${item.insight.summary}` : ""}`
      )
      .join("\n\n");

    // Build prompt with sanitized inputs
    const prompt = REPORT_GENERATION_PROMPT.replace(
      "{problemTitle}",
      sanitizeForPrompt(problem.title)
    )
      .replace("{problemDescription}", sanitizeForPrompt(problem.description))
      .replace("{problemCategory}", problem.category)
      .replace("{problemSeverity}", problem.severity)
      .replace("{researchLinks}", researchLinksSummary);

    // Call LLM
    const response = await llm.invoke(prompt);
    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    // Parse and validate LLM response using Zod schema
    const parsed = parseLLMResponse(content, LLMReportResponseSchema);
    if (!parsed) {
      return { error: "Failed to parse or validate report from LLM response" };
    }

    // Map paper references to actual IDs
    const paperIdMap = new Map(
      validLinks.map((item: LinkData, idx: number) => [
        `paper${idx + 1}`,
        item.paper._id,
      ])
    );

    // Create solution report
    const reportId = await client.mutation(api.solutionReports.create, {
      problemId: state.problemId,
      title: parsed.title,
      executiveSummary: parsed.executiveSummary,
      sections: parsed.sections.map((section) => ({
        title: section.title,
        content: section.content,
        citations: (section.paperIds ?? [])
          .map((id) => paperIdMap.get(id))
          .filter((id): id is Id<"papers"> => id !== undefined),
      })),
      recommendations: parsed.recommendations.map((rec) => ({
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        effort: rec.effort,
        relatedPapers: (rec.paperIds ?? [])
          .map((id) => paperIdMap.get(id))
          .filter((id): id is Id<"papers"> => id !== undefined),
      })),
      linkedResearch: state.approvedLinkIds,
    });

    // Update problem status to solution-found
    await client.mutation(api.problems.updateStatus, {
      id: state.problemId,
      status: "solution-found",
    });

    // Complete agent run
    await client.mutation(api.agentRuns.complete, {
      id: state.runId,
      output: {
        status: "completed",
        linksCreated: state.createdLinkIds.length,
        approvedLinks: state.approvedLinkIds.length,
        reportId,
      },
    });

    return { reportId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate report";
    return { error: message };
  }
}
