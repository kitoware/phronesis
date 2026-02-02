import { z } from "zod";
import type { ProblemDiscoveryStateType } from "../state";
import type { Problem, SearchResult, ProblemCategory } from "../types";
import { mapSeverityFromScore } from "../types";
import { CONFIG } from "../config";
import { openrouter } from "../utils/openrouter-client";

const ExtractedProblemSchema = z.object({
  statement: z.string(),
  description: z.string(),
  category: z.enum([
    "technical",
    "operational",
    "market",
    "product",
    "scaling",
    "business",
  ]),
  severityScore: z.number().min(1).max(10),
  frequency: z.enum(["rare", "occasional", "common", "ubiquitous"]).optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
  tags: z.array(z.string()),
});

const ExtractionResponseSchema = z.object({
  problems: z.array(ExtractedProblemSchema),
});

type ExtractedProblem = z.infer<typeof ExtractedProblemSchema>;

function buildExtractionPrompt(results: SearchResult[]): string {
  const content = results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\nPlatform: ${r.platform}\nContent: ${r.text.slice(0, 1500)}\n${r.highlights ? `Highlights: ${r.highlights.join(" | ")}` : ""}`
    )
    .join("\n\n---\n\n");

  return `Analyze the following content from various sources and extract any startup pain points, challenges, or problems mentioned.

For each problem identified, extract:
1. statement: A concise problem statement (1-2 sentences)
2. description: Detailed description of the problem
3. category: One of "technical", "operational", "market", "product", "scaling", or "business"
4. severityScore: How severe is this problem? (1-10, where 10 is critical)
5. frequency: How often is this problem mentioned? (rare, occasional, common, ubiquitous)
6. urgency: How urgent is solving this? (low, medium, high)
7. confidence: How confident are you this is a real problem? (0-1)
8. evidence: Direct quote or paraphrase from the source
9. tags: Relevant keywords/tags

Only extract genuine problems that startups face. Ignore promotional content, ads, or irrelevant information.

Content to analyze:

${content}

Respond with a JSON object in this exact format:
{
  "problems": [
    {
      "statement": "...",
      "description": "...",
      "category": "...",
      "severityScore": ...,
      "frequency": "...",
      "urgency": "...",
      "confidence": ...,
      "evidence": "...",
      "tags": ["...", "..."]
    }
  ]
}`;
}

function mapCategory(category: string): ProblemCategory {
  if (category === "business") return "market";
  return category as ProblemCategory;
}

function transformExtractedProblem(
  extracted: ExtractedProblem,
  source: SearchResult
): Problem {
  return {
    statement: extracted.statement,
    description: extracted.description,
    category: mapCategory(extracted.category),
    severity: mapSeverityFromScore(extracted.severityScore),
    frequency: extracted.frequency,
    urgency: extracted.urgency,
    evidence: [
      {
        source: source.platform,
        excerpt: extracted.evidence,
        url: source.url,
        date: source.publishedDate,
      },
    ],
    tags: extracted.tags,
    confidence: extracted.confidence,
    sourceUrl: source.url,
  };
}

export async function extractProblemsNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  const { rawResults } = state;
  const extractedProblems: Problem[] = [];
  const errors: ProblemDiscoveryStateType["errors"] = [];
  let totalTokensUsed = 0;
  let apiCalls = 0;

  const batches: SearchResult[][] = [];
  for (let i = 0; i < rawResults.length; i += CONFIG.extraction.batchSize) {
    batches.push(rawResults.slice(i, i + CONFIG.extraction.batchSize));
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];

    try {
      const prompt = buildExtractionPrompt(batch);

      const response = await openrouter.chatWithRetry({
        model: CONFIG.extraction.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert at analyzing startup discussions and extracting pain points. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: CONFIG.extraction.temperature,
      });

      apiCalls++;
      totalTokensUsed += response.usage?.total_tokens ?? 0;

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from LLM");
      }

      const parsed = JSON.parse(content);
      const validated = ExtractionResponseSchema.parse(parsed);

      for (const extracted of validated.problems) {
        if (extracted.confidence < CONFIG.extraction.confidenceThreshold) {
          continue;
        }

        const sourceResult = batch[0];
        const problem = transformExtractedProblem(extracted, sourceResult);
        extractedProblems.push(problem);
      }
    } catch (error) {
      errors.push({
        node: "extract_problems",
        error: `Batch ${batchIdx + 1} failed: ${error instanceof Error ? error.message : String(error)}`,
        recoverable: true,
        timestamp: Date.now(),
      });
    }

    await new Promise((resolve) =>
      setTimeout(resolve, CONFIG.rateLimit.openrouter.baseDelayMs)
    );
  }

  return {
    extractedProblems,
    errors,
    status: "extracting",
    progress: {
      current: 3,
      total: 6,
      stage: `Extracted ${extractedProblems.length} problems from ${rawResults.length} results`,
    },
    metrics: {
      startTime: state.metrics.startTime,
      searchQueries: state.metrics.searchQueries,
      rawResults: state.metrics.rawResults,
      extractedProblems: extractedProblems.length,
      implicitSignals: 0,
      clusters: 0,
      apiCalls,
      tokensUsed: totalTokensUsed,
    },
  };
}
