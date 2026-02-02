import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference, FunctionArgs } from "convex/server";
import type { ProcessedPaper, Insight, Diagram } from "../types";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

// Type for paper IDs (string format used by Convex)
type PaperId = string;
type InsightId = string;
type PaperContentId = string;
type DiagramId = string;

// Create a typed wrapper for Convex client
interface ConvexClient {
  query<T>(name: string, args: Record<string, unknown>): Promise<T>;
  mutation<T>(name: string, args: Record<string, unknown>): Promise<T>;
}

export function createConvexClient(): ConvexClient {
  if (!CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
  }
  const client = new ConvexHttpClient(CONVEX_URL);

  return {
    query: <T>(name: string, args: Record<string, unknown>) =>
      client.query(
        name as unknown as FunctionReference<"query">,
        args as FunctionArgs<FunctionReference<"query">>
      ) as Promise<T>,
    mutation: <T>(name: string, args: Record<string, unknown>) =>
      client.mutation(
        name as unknown as FunctionReference<"mutation">,
        args as FunctionArgs<FunctionReference<"mutation">>
      ) as Promise<T>,
  };
}

interface Paper {
  _id: PaperId;
  arxivId: string;
}

export async function checkPaperExists(
  client: ConvexClient,
  arxivId: string
): Promise<PaperId | null> {
  const paper = await client.query<Paper | null>("papers:getByArxivId", {
    arxivId,
  });
  return paper?._id ?? null;
}

export async function savePaper(
  client: ConvexClient,
  paper: ProcessedPaper
): Promise<PaperId> {
  const paperId = await client.mutation<PaperId>("papers:create", {
    arxivId: paper.arxivId,
    title: paper.title,
    abstract: paper.abstract,
    authors: paper.authors,
    categories: paper.categories,
    primaryCategory: paper.primaryCategory,
    publishedDate: paper.publishedDate,
    updatedDate: paper.updatedDate,
    pdfUrl: paper.pdfUrl,
    doi: paper.doi,
    journalRef: paper.journalRef,
    comments: paper.comments,
  });

  return paperId;
}

export async function savePaperContent(
  client: ConvexClient,
  paperId: PaperId,
  paper: ProcessedPaper
): Promise<PaperContentId> {
  const contentId = await client.mutation<PaperContentId>(
    "paperContent:create",
    {
      paperId,
      fullText: paper.fullText,
      sections: paper.sections,
      figures: paper.figures,
      tables: paper.tables,
      equations: paper.equations,
      references: paper.references,
    }
  );

  return contentId;
}

export async function saveInsight(
  client: ConvexClient,
  paperId: PaperId,
  insight: Insight
): Promise<InsightId> {
  const insightId = await client.mutation<InsightId>("insights:create", {
    paperId,
    summary: insight.summary,
    keyFindings: insight.keyFindings,
    methodology: insight.methodology,
    limitations: insight.limitations,
    futureWork: insight.futureWork,
    technicalContributions: insight.technicalContributions,
    practicalApplications: insight.practicalApplications,
    targetAudience: insight.targetAudience,
    prerequisites: insight.prerequisites,
    embedding: insight.embedding,
    analysisVersion: "3.0",
    // Plan 3 fields
    problemStatement: insight.problemStatement,
    proposedSolution: insight.proposedSolution,
    technicalApproach: insight.technicalApproach,
    mainResults: insight.mainResults,
    contributions: insight.contributions,
    statedLimitations: insight.statedLimitations,
    inferredWeaknesses: insight.inferredWeaknesses,
    reproducibilityScore: insight.reproducibilityScore,
    industryApplications: insight.industryApplications,
    technologyReadinessLevel: insight.technologyReadinessLevel,
    timeToCommercial: insight.timeToCommercial,
    enablingTechnologies: insight.enablingTechnologies,
    summaries: insight.summaries,
  });

  return insightId;
}

export async function saveDiagram(
  client: ConvexClient,
  paperId: PaperId,
  insightId: InsightId | undefined,
  diagram: Diagram
): Promise<DiagramId> {
  const diagramId = await client.mutation<DiagramId>("diagrams:create", {
    paperId,
    insightId,
    type: diagram.type,
    title: diagram.title,
    description: diagram.description,
    mermaidCode: diagram.mermaidCode,
    d3Config: diagram.d3Config,
    svgContent: diagram.svgContent,
  });

  return diagramId;
}

export async function updatePaperStatus(
  client: ConvexClient,
  paperId: PaperId,
  status: "pending" | "processing" | "completed" | "failed",
  error?: string
): Promise<void> {
  await client.mutation("papers:updateStatus", {
    id: paperId,
    status,
    error,
  });
}
