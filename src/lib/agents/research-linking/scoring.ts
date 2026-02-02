import { z } from "zod";
import type { Id } from "../shared/convex-client";

/**
 * Configuration constants for the research-linking agent.
 */
export const CONFIG = {
  VECTOR_SEARCH_LIMIT: 20,
  LLM_BATCH_SIZE: 5,
  TOP_CANDIDATES_LIMIT: 10,
  SCORING_MAX_TOKENS: 4096,
  REPORT_MAX_TOKENS: 8192,
  MAX_KEY_INSIGHTS: 10,
  MAX_APPLICATION_SUGGESTIONS: 10,
  MAX_STRING_LENGTH: 2000,
} as const;

/**
 * 5-dimension scoring for research-problem matching.
 * Each dimension is scored 0-1.
 */
export interface MatchScore {
  /** How directly the research addresses the problem (0-1) */
  technicalFit: number;
  /** Research readiness gap - inverted: smaller gap = higher score (0-1) */
  trlGap: number;
  /** Speed of potential implementation (0-1) */
  timeToValue: number;
  /** Uniqueness of approach (0-1) */
  novelty: number;
  /** Quality of experimental validation (0-1) */
  evidenceStrength: number;
}

/**
 * Weights for computing overall score from 5 dimensions.
 */
export const SCORE_WEIGHTS: MatchScore = {
  technicalFit: 0.3,
  trlGap: 0.2,
  timeToValue: 0.2,
  novelty: 0.15,
  evidenceStrength: 0.15,
};

/**
 * Match type thresholds based on technicalFit score.
 */
export const MATCH_TYPE_THRESHOLDS = {
  direct: 0.8,
  methodology: 0.6,
  tangential: 0.4,
} as const;

/**
 * Match types for research-problem links.
 */
export type MatchType = "direct" | "methodology" | "tangential" | "inspiration";

/**
 * Candidate match with scores and metadata.
 */
export interface CandidateMatch {
  insightId: Id<"insights">;
  paperId: Id<"papers">;
  paperTitle: string;
  insightSummary: string;
  vectorSimilarity: number;
  scores: MatchScore;
  overallScore: number;
  matchType: MatchType;
  matchRationale: string;
  keyInsights: string[];
  applicationSuggestions: string[];
}

/**
 * Computes the overall score as a weighted average of all dimensions.
 */
export function computeOverallScore(scores: MatchScore): number {
  const weightedSum =
    scores.technicalFit * SCORE_WEIGHTS.technicalFit +
    scores.trlGap * SCORE_WEIGHTS.trlGap +
    scores.timeToValue * SCORE_WEIGHTS.timeToValue +
    scores.novelty * SCORE_WEIGHTS.novelty +
    scores.evidenceStrength * SCORE_WEIGHTS.evidenceStrength;

  // Ensure result is between 0 and 1
  return Math.max(0, Math.min(1, weightedSum));
}

/**
 * Determines match type based on technicalFit score.
 */
export function determineMatchType(technicalFit: number): MatchType {
  if (technicalFit >= MATCH_TYPE_THRESHOLDS.direct) {
    return "direct";
  }
  if (technicalFit >= MATCH_TYPE_THRESHOLDS.methodology) {
    return "methodology";
  }
  if (technicalFit >= MATCH_TYPE_THRESHOLDS.tangential) {
    return "tangential";
  }
  return "inspiration";
}

/**
 * Validates that all scores are within valid range (0-1).
 */
export function validateScores(scores: MatchScore): boolean {
  return Object.values(scores).every((score) => score >= 0 && score <= 1);
}

/**
 * Creates a default empty MatchScore.
 */
export function createEmptyScore(): MatchScore {
  return {
    technicalFit: 0,
    trlGap: 0,
    timeToValue: 0,
    novelty: 0,
    evidenceStrength: 0,
  };
}

/**
 * Zod schema for validating LLM scoring response.
 */
export const LLMScoreResponseSchema = z.object({
  scores: z.object({
    technicalFit: z.number().min(0).max(1),
    trlGap: z.number().min(0).max(1),
    timeToValue: z.number().min(0).max(1),
    novelty: z.number().min(0).max(1),
    evidenceStrength: z.number().min(0).max(1),
  }),
  matchRationale: z.string().max(CONFIG.MAX_STRING_LENGTH),
  keyInsights: z.array(z.string().max(500)).max(CONFIG.MAX_KEY_INSIGHTS),
  applicationSuggestions: z
    .array(z.string().max(500))
    .max(CONFIG.MAX_APPLICATION_SUGGESTIONS),
});

export type LLMScoreResponse = z.infer<typeof LLMScoreResponseSchema>;

/**
 * Zod schema for validating LLM report generation response.
 */
export const LLMReportResponseSchema = z.object({
  title: z.string().max(200),
  executiveSummary: z.string().max(5000),
  sections: z
    .array(
      z.object({
        title: z.string().max(200),
        content: z.string().max(10000),
        paperIds: z.array(z.string()).optional(),
      })
    )
    .max(10),
  recommendations: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(2000),
        priority: z.enum(["low", "medium", "high"]),
        effort: z.enum(["low", "medium", "high"]),
        paperIds: z.array(z.string()).optional(),
      })
    )
    .max(10),
});

export type LLMReportResponse = z.infer<typeof LLMReportResponseSchema>;

/**
 * Parses and validates a JSON response from the LLM.
 * Returns null if parsing or validation fails.
 */
export function parseLLMResponse<T>(
  content: string,
  schema: z.ZodType<T>
): T | null {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    const result = schema.safeParse(parsed);
    if (!result.success) {
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

/**
 * Sanitizes text for inclusion in LLM prompts.
 * Limits length and escapes potentially problematic characters.
 */
export function sanitizeForPrompt(
  input: string,
  maxLength = CONFIG.MAX_STRING_LENGTH
): string {
  return input.slice(0, maxLength).replace(/[`]/g, "'");
}

/**
 * LLM prompt template for scoring a research-problem match.
 */
export const SCORING_PROMPT_TEMPLATE = `You are an expert research analyst evaluating how well a research paper can help solve a startup's problem.

## Problem
Title: {problemTitle}
Description: {problemDescription}
Category: {problemCategory}
Severity: {problemSeverity}

## Research Paper
Title: {paperTitle}
Abstract: {paperAbstract}

## Research Insights
Summary: {insightSummary}
Key Findings: {keyFindings}
Methodology: {methodology}
Practical Applications: {practicalApplications}

## Your Task
Score this research-problem match on 5 dimensions (0.0 to 1.0 scale):

1. **technicalFit** (weight: 30%): How directly does this research address the problem?
   - 0.8-1.0: Direct solution to the core problem
   - 0.6-0.8: Addresses methodology that could solve the problem
   - 0.4-0.6: Tangentially related, requires adaptation
   - 0.0-0.4: Inspirational only, significant gap

2. **trlGap** (weight: 20%): Research readiness (inverted: smaller gap = higher score)
   - 0.8-1.0: Ready for immediate application
   - 0.6-0.8: Needs minor adaptation/testing
   - 0.4-0.6: Requires significant development
   - 0.0-0.4: Early research, major development needed

3. **timeToValue** (weight: 20%): Speed of potential implementation
   - 0.8-1.0: Can be implemented in weeks
   - 0.6-0.8: 1-3 months implementation
   - 0.4-0.6: 3-6 months implementation
   - 0.0-0.4: 6+ months or unclear timeline

4. **novelty** (weight: 15%): Uniqueness of the approach
   - 0.8-1.0: Novel approach not commonly used
   - 0.6-0.8: Innovative combination of techniques
   - 0.4-0.6: Known technique applied to new domain
   - 0.0-0.4: Standard approach, widely used

5. **evidenceStrength** (weight: 15%): Quality of experimental validation
   - 0.8-1.0: Strong empirical results, multiple validations
   - 0.6-0.8: Solid experiments, reproducible
   - 0.4-0.6: Limited experiments, some validation
   - 0.0-0.4: Theoretical only, no validation

Also provide:
- **matchRationale**: 2-3 sentences explaining why this research is relevant
- **keyInsights**: 3-5 specific insights from the research that apply to this problem
- **applicationSuggestions**: 2-4 concrete suggestions for how to apply this research

Respond in JSON format:
\`\`\`json
{
  "scores": {
    "technicalFit": 0.0,
    "trlGap": 0.0,
    "timeToValue": 0.0,
    "novelty": 0.0,
    "evidenceStrength": 0.0
  },
  "matchRationale": "...",
  "keyInsights": ["...", "..."],
  "applicationSuggestions": ["...", "..."]
}
\`\`\``;

/**
 * LLM prompt template for generating a solution report.
 */
export const REPORT_GENERATION_PROMPT = `You are an expert research analyst creating a comprehensive solution report for a startup problem.

## Problem
Title: {problemTitle}
Description: {problemDescription}
Category: {problemCategory}
Severity: {problemSeverity}

## Approved Research Links
{researchLinks}

## Your Task
Create a comprehensive solution report with:

1. **title**: A clear, actionable title for the report
2. **executiveSummary**: 2-3 paragraph summary of the key findings and recommendations
3. **sections**: 3-5 detailed sections covering:
   - Problem Analysis
   - Research Findings
   - Proposed Solutions
   - Implementation Considerations
   - Risk Assessment
4. **recommendations**: 3-5 prioritized recommendations with:
   - title: Short action title
   - description: Detailed explanation
   - priority: "low" | "medium" | "high"
   - effort: "low" | "medium" | "high"

Respond in JSON format:
\`\`\`json
{
  "title": "...",
  "executiveSummary": "...",
  "sections": [
    {
      "title": "...",
      "content": "...",
      "paperIds": ["paper1", "paper2"]
    }
  ],
  "recommendations": [
    {
      "title": "...",
      "description": "...",
      "priority": "high",
      "effort": "medium",
      "paperIds": ["paper1"]
    }
  ]
}
\`\`\``;
