import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ResearchAgentStateType } from "../state";
import {
  createLLMClient,
  ComprehensionSchema,
  ContributionSchema,
  CriticalAnalysisSchema,
  ImplicationSynthesisSchema,
  SummaryGenerationSchema,
  LegacyInsightSchema,
  STAGE_PROMPTS,
  type Comprehension,
  type ContributionAnalysis,
  type CriticalAnalysis,
  type ImplicationSynthesis,
  type SummaryGeneration,
  type LegacyInsight,
} from "../tools/llm";
import type { Insight, ProcessedPaper, AgentError } from "../types";

function buildPaperContext(paper: ProcessedPaper): string {
  let context = `Title: ${paper.title}\n\n`;
  context += `Authors: ${paper.authors.map((a) => a.name).join(", ")}\n\n`;
  context += `Categories: ${paper.categories.join(", ")}\n\n`;
  context += `Abstract:\n${paper.abstract}\n\n`;

  if (paper.fullText) {
    // Use full text if available, truncate if too long
    const maxFullTextLength = 50000;
    const truncatedText =
      paper.fullText.length > maxFullTextLength
        ? paper.fullText.substring(0, maxFullTextLength) + "..."
        : paper.fullText;
    context += `Full Text:\n${truncatedText}\n\n`;
  }

  if (paper.sections.length > 0) {
    context += "Sections:\n";
    for (const section of paper.sections) {
      const sectionContent =
        section.content.length > 5000
          ? section.content.substring(0, 5000) + "..."
          : section.content;
      context += `\n## ${section.title}\n${sectionContent}\n`;
    }
  }

  return context;
}

async function runStage<T>(
  llm: ReturnType<typeof createLLMClient>,
  systemPrompt: string,
  paperContext: string,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  const structuredLlm = llm.withStructuredOutput(schema);

  const result = await structuredLlm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(paperContext),
  ]);

  return result as T;
}

async function analyzePaper(
  paper: ProcessedPaper
): Promise<{ insight: Insight; error?: string }> {
  const llm = createLLMClient();
  const paperContext = buildPaperContext(paper);

  // Run all 5 stages + legacy fields
  const [
    comprehension,
    contributions,
    criticalAnalysis,
    implications,
    summaries,
    legacy,
  ] = await Promise.all([
    runStage<Comprehension>(
      llm,
      STAGE_PROMPTS.comprehension,
      paperContext,
      ComprehensionSchema
    ),
    runStage<ContributionAnalysis>(
      llm,
      STAGE_PROMPTS.contribution,
      paperContext,
      ContributionSchema
    ),
    runStage<CriticalAnalysis>(
      llm,
      STAGE_PROMPTS.critical,
      paperContext,
      CriticalAnalysisSchema
    ),
    runStage<ImplicationSynthesis>(
      llm,
      STAGE_PROMPTS.implication,
      paperContext,
      ImplicationSynthesisSchema
    ),
    runStage<SummaryGeneration>(
      llm,
      STAGE_PROMPTS.summary,
      paperContext,
      SummaryGenerationSchema
    ),
    runStage<LegacyInsight>(
      llm,
      STAGE_PROMPTS.legacy,
      paperContext,
      LegacyInsightSchema
    ),
  ]);

  // Combine all analysis into a single Insight object
  const insight: Insight = {
    // Legacy fields
    summary: legacy.summary,
    keyFindings: legacy.keyFindings,
    methodology: legacy.methodology,
    limitations: legacy.limitations,
    futureWork: legacy.futureWork,
    technicalContributions: legacy.technicalContributions,
    practicalApplications: legacy.practicalApplications,
    targetAudience: legacy.targetAudience,
    prerequisites: legacy.prerequisites,
    embedding: [], // Will be filled in by generate-embeddings node

    // Plan 3 fields - Stage 1: Comprehension
    problemStatement: comprehension.problemStatement,
    proposedSolution: comprehension.proposedSolution,
    technicalApproach: comprehension.technicalApproach,
    mainResults: comprehension.mainResults,

    // Stage 2: Contribution Analysis
    contributions: contributions.contributions,

    // Stage 3: Critical Analysis
    statedLimitations: criticalAnalysis.statedLimitations,
    inferredWeaknesses: criticalAnalysis.inferredWeaknesses,
    reproducibilityScore: criticalAnalysis.reproducibilityScore,

    // Stage 4: Implication Synthesis
    industryApplications: implications.industryApplications,
    technologyReadinessLevel: implications.technologyReadinessLevel,
    timeToCommercial: implications.timeToCommercial,
    enablingTechnologies: implications.enablingTechnologies,

    // Stage 5: Summaries
    summaries: summaries,
  };

  return { insight };
}

export async function analyzeLlmNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { processedPapers } = state;
  const errors: AgentError[] = [];
  const insights: Insight[] = [];

  for (let i = 0; i < processedPapers.length; i++) {
    const paper = processedPapers[i];

    try {
      const { insight, error } = await analyzePaper(paper);

      if (error) {
        errors.push({
          stage: "analyze-llm",
          message: error,
          paperId: paper.arxivId,
          timestamp: Date.now(),
        });
      }

      insights.push(insight);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during LLM analysis";

      errors.push({
        stage: "analyze-llm",
        message: `Failed to analyze ${paper.arxivId}: ${errorMessage}`,
        paperId: paper.arxivId,
        timestamp: Date.now(),
      });

      // Create a minimal insight on failure
      insights.push({
        summary: paper.abstract,
        keyFindings: [],
        methodology: "",
        limitations: [],
        futureWork: [],
        technicalContributions: [],
        practicalApplications: [],
        targetAudience: [],
        prerequisites: [],
        embedding: [],
      });
    }
  }

  return {
    insights,
    errors,
    status: "analyzing",
    progressMessage: `Analyzed ${insights.length} papers with LLM`,
  };
}
