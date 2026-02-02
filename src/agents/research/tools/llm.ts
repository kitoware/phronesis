import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL_NAME = "anthropic/claude-sonnet-4-20250514";

// Create OpenRouter client
export function createLLMClient() {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  return new ChatOpenAI({
    modelName: MODEL_NAME,
    configuration: {
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        "HTTP-Referer": "https://phronesis.ai",
        "X-Title": "Phronesis Research Agent",
      },
    },
    apiKey: OPENROUTER_API_KEY,
    temperature: 0.3,
  });
}

// Stage 1: Comprehension Schema
export const ComprehensionSchema = z.object({
  problemStatement: z
    .string()
    .describe("The core problem or research question being addressed"),
  proposedSolution: z
    .string()
    .describe("The main solution or approach proposed by the authors"),
  technicalApproach: z
    .string()
    .describe("Key technical methods and techniques used"),
  mainResults: z.string().describe("Primary findings and experimental results"),
});

export type Comprehension = z.infer<typeof ComprehensionSchema>;

// Stage 2: Contribution Analysis Schema
export const ContributionSchema = z.object({
  contributions: z.array(
    z.object({
      rank: z.number().describe("Importance ranking (1 = most important)"),
      contribution: z.string().describe("Description of the contribution"),
      noveltyScore: z.number().min(1).max(10).describe("Novelty score (1-10)"),
      evidenceStrength: z
        .number()
        .min(1)
        .max(10)
        .describe("How well supported by evidence (1-10)"),
    })
  ),
});

export type ContributionAnalysis = z.infer<typeof ContributionSchema>;

// Stage 3: Critical Analysis Schema
export const CriticalAnalysisSchema = z.object({
  statedLimitations: z
    .array(z.string())
    .describe("Limitations explicitly stated by the authors"),
  inferredWeaknesses: z
    .array(z.string())
    .describe("Weaknesses or gaps not acknowledged by authors"),
  reproducibilityScore: z
    .number()
    .min(1)
    .max(10)
    .describe("How reproducible is this work (1-10)"),
});

export type CriticalAnalysis = z.infer<typeof CriticalAnalysisSchema>;

// Stage 4: Implication Synthesis Schema
export const ImplicationSynthesisSchema = z.object({
  industryApplications: z.array(
    z.object({
      industry: z.string().describe("Target industry sector"),
      application: z.string().describe("Specific use case or application"),
      feasibility: z
        .enum(["low", "medium", "high"])
        .describe("Implementation feasibility"),
    })
  ),
  technologyReadinessLevel: z
    .number()
    .min(1)
    .max(9)
    .describe("NASA TRL scale (1-9)"),
  timeToCommercial: z
    .string()
    .describe("Estimated time to commercial viability"),
  enablingTechnologies: z
    .array(z.string())
    .describe("Technologies needed for practical implementation"),
});

export type ImplicationSynthesis = z.infer<typeof ImplicationSynthesisSchema>;

// Stage 5: Summary Generation Schema
export const SummaryGenerationSchema = z.object({
  technical: z
    .string()
    .describe("Technical summary for researchers (2-3 paragraphs)"),
  executive: z
    .string()
    .describe("Executive summary for business leaders (1 paragraph)"),
  tweet: z.string().max(280).describe("Twitter-length summary (max 280 chars)"),
  eli5: z
    .string()
    .describe("Explain like I'm 5 - simple explanation for non-experts"),
});

export type SummaryGeneration = z.infer<typeof SummaryGenerationSchema>;

// Combined insight schema for legacy fields
export const LegacyInsightSchema = z.object({
  summary: z.string().describe("One paragraph summary of the paper"),
  keyFindings: z.array(z.string()).describe("List of 3-5 key findings"),
  methodology: z.string().describe("Description of the methodology used"),
  limitations: z.array(z.string()).describe("List of limitations"),
  futureWork: z.array(z.string()).describe("Potential future work directions"),
  technicalContributions: z.array(
    z.object({
      type: z
        .string()
        .describe("Type of contribution (algorithm, dataset, etc.)"),
      description: z.string().describe("Description of the contribution"),
      significance: z
        .enum(["incremental", "notable", "significant", "breakthrough"])
        .describe("Significance level"),
    })
  ),
  practicalApplications: z
    .array(z.string())
    .describe("Practical applications of this research"),
  targetAudience: z
    .array(z.string())
    .describe("Who would benefit from this research"),
  prerequisites: z
    .array(z.string())
    .describe("Background knowledge needed to understand this paper"),
});

export type LegacyInsight = z.infer<typeof LegacyInsightSchema>;

// Prompts for each stage
export const STAGE_PROMPTS = {
  comprehension: `You are an expert research analyst. Analyze the following academic paper and extract the core comprehension elements.

Focus on understanding:
1. What problem is being solved?
2. What solution is proposed?
3. What technical approach is used?
4. What are the main results?

Be precise and technical. Avoid vague language.`,

  contribution: `You are an expert at evaluating academic contributions. Analyze this paper and identify the key contributions.

For each contribution:
- Rank by importance (1 = most important)
- Assess novelty (1-10 scale)
- Assess evidence strength (1-10 scale)

Focus on what's genuinely new vs. incremental improvements.`,

  critical: `You are a critical research reviewer. Analyze this paper for weaknesses and limitations.

Identify:
1. Limitations the authors explicitly mention
2. Weaknesses or gaps they don't acknowledge
3. How reproducible is this work (1-10)?

Be fair but thorough. Focus on substantive issues, not minor nitpicks.`,

  implication: `You are a technology transfer specialist. Analyze the practical implications of this research.

Determine:
1. Which industries could apply this research?
2. Technology Readiness Level (1-9 NASA TRL scale)
3. Time to commercial viability
4. What enabling technologies are needed?

Be realistic about timelines and feasibility.`,

  summary: `You are a science communicator. Create multiple summaries of this paper for different audiences.

Generate:
1. Technical summary (2-3 paragraphs for researchers)
2. Executive summary (1 paragraph for business leaders)
3. Tweet (max 280 characters)
4. ELI5 (explain to a 5-year-old)

Adapt language and complexity for each audience.`,

  legacy: `You are an expert research analyst. Analyze this academic paper and provide a comprehensive analysis.

Extract:
1. A one-paragraph summary
2. 3-5 key findings
3. Methodology description
4. Limitations
5. Future work directions
6. Technical contributions with significance levels
7. Practical applications
8. Target audience
9. Prerequisites for understanding

Be precise and thorough.`,
};
