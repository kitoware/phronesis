import { z } from "zod";
import type { ProblemDiscoveryStateType } from "../state";
import type {
  ImplicitSignal,
  ImplicitSignalType,
  SearchResult,
} from "../types";
import { CONFIG } from "../config";
import { openrouter, MODELS } from "../utils/openrouter-client";

interface PatternMatch {
  signalType: ImplicitSignalType;
  match: string;
  result: SearchResult;
}

const ImplicitSignalSchema = z.object({
  inferredProblem: z.string(),
  confidence: z.number().min(0).max(1),
  keywords: z.array(z.string()),
  reasoning: z.string(),
});

const InferenceResponseSchema = z.object({
  signals: z.array(ImplicitSignalSchema),
});

function findPatternMatches(results: SearchResult[]): PatternMatch[] {
  const matches: PatternMatch[] = [];

  for (const result of results) {
    const searchText = `${result.title} ${result.text}`.toLowerCase();

    for (const [signalType, patterns] of Object.entries(
      CONFIG.implicit.patterns
    )) {
      for (const pattern of patterns) {
        const match = searchText.match(pattern);
        if (match) {
          matches.push({
            signalType: signalType as ImplicitSignalType,
            match: match[0],
            result,
          });
          break;
        }
      }
    }
  }

  return matches;
}

function buildInferencePrompt(matches: PatternMatch[]): string {
  const content = matches
    .map(
      (m, i) =>
        `[${i + 1}] Signal Type: ${m.signalType}
Matched Pattern: "${m.match}"
Title: ${m.result.title}
URL: ${m.result.url}
Content: ${m.result.text.slice(0, 1000)}`
    )
    .join("\n\n---\n\n");

  return `Analyze the following content where implicit signals of startup problems have been detected.

For each signal, infer:
1. inferredProblem: What underlying problem does this signal indicate?
2. confidence: How confident are you in this inference? (0-1)
3. keywords: Relevant keywords for this problem
4. reasoning: Brief explanation of your inference

Signal types and their meanings:
- build_vs_buy: Company built custom solution because existing tools were inadequate
- excessive_hiring: Difficulty retaining employees or constantly hiring for same role
- workaround_sharing: People sharing hacks or temporary fixes for tool limitations
- migration_announcement: Company moved away from a tool/platform
- open_source_creation: Company released internal tool as open source
- integration_complaint: Issues with integrating systems or missing APIs
- scale_breakpoint: System failures or issues at scale
- manual_process: Tedious manual work that should be automated

Content to analyze:

${content}

Respond with a JSON object in this exact format:
{
  "signals": [
    {
      "inferredProblem": "...",
      "confidence": ...,
      "keywords": ["...", "..."],
      "reasoning": "..."
    }
  ]
}`;
}

export async function detectImplicitNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  const { rawResults } = state;
  const implicitSignals: ImplicitSignal[] = [];
  const errors: ProblemDiscoveryStateType["errors"] = [];
  let totalTokensUsed = 0;
  let apiCalls = 0;

  const patternMatches = findPatternMatches(rawResults);

  if (patternMatches.length === 0) {
    return {
      implicitSignals: [],
      errors,
      status: "detecting",
      progress: {
        current: 4,
        total: 6,
        stage: "No implicit signals detected",
      },
      metrics: {
        startTime: state.metrics.startTime,
        searchQueries: state.metrics.searchQueries,
        rawResults: state.metrics.rawResults,
        extractedProblems: state.extractedProblems.length,
        implicitSignals: 0,
        clusters: 0,
        apiCalls: 0,
        tokensUsed: 0,
      },
    };
  }

  const batchSize = 20;
  for (let i = 0; i < patternMatches.length; i += batchSize) {
    const batch = patternMatches.slice(i, i + batchSize);

    try {
      const prompt = buildInferencePrompt(batch);

      const response = await openrouter.chatWithRetry({
        model: MODELS.CLAUDE_3_HAIKU,
        messages: [
          {
            role: "system",
            content:
              "You are an expert at analyzing implicit signals in startup discussions to identify underlying problems. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      apiCalls++;
      totalTokensUsed += response.usage?.total_tokens ?? 0;

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from LLM");
      }

      const parsed = JSON.parse(content);
      const validated = InferenceResponseSchema.parse(parsed);

      validated.signals.forEach((signal, idx) => {
        if (signal.confidence < CONFIG.implicit.confidenceThreshold) {
          return;
        }

        const matchInfo = batch[idx];
        if (!matchInfo) return;

        implicitSignals.push({
          signalType: matchInfo.signalType,
          inferredProblem: signal.inferredProblem,
          confidence: signal.confidence,
          evidence: {
            source: matchInfo.result.platform,
            excerpt: matchInfo.match,
            url: matchInfo.result.url,
          },
          keywords: signal.keywords,
        });
      });
    } catch (error) {
      errors.push({
        node: "detect_implicit",
        error: `Batch starting at ${i} failed: ${error instanceof Error ? error.message : String(error)}`,
        recoverable: true,
        timestamp: Date.now(),
      });
    }

    await new Promise((resolve) =>
      setTimeout(resolve, CONFIG.rateLimit.openrouter.baseDelayMs)
    );
  }

  return {
    implicitSignals,
    errors,
    status: "detecting",
    progress: {
      current: 4,
      total: 6,
      stage: `Detected ${implicitSignals.length} implicit signals from ${patternMatches.length} pattern matches`,
    },
    metrics: {
      startTime: state.metrics.startTime,
      searchQueries: state.metrics.searchQueries,
      rawResults: state.metrics.rawResults,
      extractedProblems: state.extractedProblems.length,
      implicitSignals: implicitSignals.length,
      clusters: 0,
      apiCalls,
      tokensUsed: totalTokensUsed,
    },
  };
}
