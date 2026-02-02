import type { ResearchAgentStateType } from "../state";
import { extractPdfFromUrl, checkPdfServiceHealth } from "../tools/pdf";
import type { ProcessedPaper, AgentError } from "../types";

export async function processPdfsNode(
  state: ResearchAgentStateType
): Promise<Partial<ResearchAgentStateType>> {
  const { fetchedPapers } = state;
  const errors: AgentError[] = [];
  const processedPapers: ProcessedPaper[] = [];

  // Check if PDF service is available
  const serviceHealthy = await checkPdfServiceHealth();

  for (const paper of fetchedPapers) {
    try {
      if (serviceHealthy) {
        // Try full PDF extraction
        const extraction = await extractPdfFromUrl(paper.pdfUrl);

        if (extraction.error) {
          // Fallback to abstract-only on extraction failure
          processedPapers.push({
            ...paper,
            sections: [],
            figures: [],
            tables: [],
            equations: [],
            references: [],
            extractionError: extraction.error,
          });

          errors.push({
            stage: "process-pdfs",
            message: `PDF extraction failed for ${paper.arxivId}: ${extraction.error}`,
            paperId: paper.arxivId,
            timestamp: Date.now(),
          });
        } else {
          processedPapers.push({
            ...paper,
            fullText: extraction.fullText,
            sections: extraction.sections,
            figures: extraction.figures,
            tables: extraction.tables,
            equations: extraction.equations,
            references: extraction.references,
          });
        }
      } else {
        // PDF service unavailable, use abstract only
        processedPapers.push({
          ...paper,
          sections: [],
          figures: [],
          tables: [],
          equations: [],
          references: [],
          extractionError: "PDF extraction service unavailable",
        });

        errors.push({
          stage: "process-pdfs",
          message: `PDF service unavailable, using abstract only for ${paper.arxivId}`,
          paperId: paper.arxivId,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Fallback to abstract-only
      processedPapers.push({
        ...paper,
        sections: [],
        figures: [],
        tables: [],
        equations: [],
        references: [],
        extractionError: errorMessage,
      });

      errors.push({
        stage: "process-pdfs",
        message: `Unexpected error processing ${paper.arxivId}: ${errorMessage}`,
        paperId: paper.arxivId,
        timestamp: Date.now(),
      });
    }
  }

  const successCount = processedPapers.filter((p) => !p.extractionError).length;

  return {
    processedPapers,
    errors,
    status: "processing",
    progressMessage: `Processed ${processedPapers.length} papers (${successCount} with full text, ${processedPapers.length - successCount} abstract-only)`,
  };
}
