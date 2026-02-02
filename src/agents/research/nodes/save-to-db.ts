import type { ResearchAgentStateType } from "../state";
import {
  createConvexClient,
  checkPaperExists,
  savePaper,
  savePaperContent,
  saveInsight,
  saveDiagram,
  updatePaperStatus,
} from "../tools/convex-client";
import type { AgentError, Diagram } from "../types";

export async function saveToDbNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { processedPapers, insights, diagrams } = state;
  const errors: AgentError[] = [];
  const savedPaperIds: string[] = [];
  const savedInsightIds: string[] = [];
  const savedDiagramIds: string[] = [];

  const client = createConvexClient();

  // Track paper IDs and insight IDs for linking diagrams
  const paperIdMap = new Map<string, string>();
  const insightIdMap = new Map<string, string>();

  // Save papers and paper content
  for (let i = 0; i < processedPapers.length; i++) {
    const paper = processedPapers[i];

    try {
      // Check if paper already exists
      let paperId = await checkPaperExists(client, paper.arxivId);

      if (!paperId) {
        // Create new paper
        paperId = await savePaper(client, paper);
        savedPaperIds.push(paperId);
      }

      paperIdMap.set(paper.arxivId, paperId);

      // Update status to processing
      await updatePaperStatus(client, paperId, "processing");

      // Save paper content if we have extracted content
      if (paper.fullText || paper.sections.length > 0) {
        await savePaperContent(client, paperId, paper);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      errors.push({
        stage: "save-to-db",
        message: `Failed to save paper ${paper.arxivId}: ${errorMessage}`,
        paperId: paper.arxivId,
        timestamp: Date.now(),
      });
    }
  }

  // Save insights
  for (let i = 0; i < insights.length; i++) {
    const insight = insights[i];
    const paper = processedPapers[i];
    const paperId = paperIdMap.get(paper?.arxivId ?? "");

    if (!paperId) {
      errors.push({
        stage: "save-to-db",
        message: `Cannot save insight - paper not found: ${paper?.arxivId}`,
        paperId: paper?.arxivId,
        timestamp: Date.now(),
      });
      continue;
    }

    try {
      const insightId = await saveInsight(client, paperId, insight);
      savedInsightIds.push(insightId);
      insightIdMap.set(paper.arxivId, insightId);

      // Update paper status to completed
      await updatePaperStatus(client, paperId, "completed");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      errors.push({
        stage: "save-to-db",
        message: `Failed to save insight for ${paper.arxivId}: ${errorMessage}`,
        paperId: paper.arxivId,
        timestamp: Date.now(),
      });

      // Update paper status to failed
      try {
        await updatePaperStatus(client, paperId, "failed", errorMessage);
      } catch {
        // Ignore status update errors
      }
    }
  }

  // Save diagrams
  // Diagrams are generated in order: 2 per paper (architecture, mindmap)
  for (let i = 0; i < processedPapers.length; i++) {
    const paper = processedPapers[i];
    const paperId = paperIdMap.get(paper.arxivId);
    const insightId = insightIdMap.get(paper.arxivId);

    if (!paperId) {
      continue;
    }

    // Each paper has up to 2 diagrams (architecture and mindmap)
    const paperDiagrams = diagrams.filter(
      (_diagram: Diagram, idx: number) => Math.floor(idx / 2) === i
    );

    for (const diagram of paperDiagrams) {
      try {
        const diagramId = await saveDiagram(
          client,
          paperId,
          insightId,
          diagram
        );
        savedDiagramIds.push(diagramId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        errors.push({
          stage: "save-to-db",
          message: `Failed to save diagram for ${paper.arxivId}: ${errorMessage}`,
          paperId: paper.arxivId,
          timestamp: Date.now(),
        });
      }
    }
  }

  return {
    savedPaperIds,
    savedInsightIds,
    savedDiagramIds,
    errors,
    status: errors.length > 0 ? "failed" : "completed",
    progressMessage: `Saved ${savedPaperIds.length} papers, ${savedInsightIds.length} insights, ${savedDiagramIds.length} diagrams to database`,
  };
}
