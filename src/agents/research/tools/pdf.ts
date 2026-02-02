import type {
  ExtractedSection,
  ExtractedFigure,
  ExtractedTable,
  ExtractedEquation,
  ExtractedReference,
} from "../types";

const PDF_EXTRACTOR_URL =
  process.env.PDF_EXTRACTOR_URL || "http://localhost:8000";

interface PdfExtractionResponse {
  fullText: string;
  sections: Array<{
    title: string;
    content: string;
    level: number;
  }>;
  figures: Array<{
    caption: string;
    reference: string;
    pageNumber?: number;
  }>;
  tables: Array<{
    caption: string;
    content: string;
    reference: string;
  }>;
  equations: Array<{
    latex: string;
    reference?: string;
    context?: string;
  }>;
  references: Array<{
    title?: string;
    authors?: string[];
    year?: string;
    venue?: string;
    doi?: string;
    arxivId?: string;
  }>;
  error?: string;
}

export interface PdfExtractionResult {
  fullText?: string;
  sections: ExtractedSection[];
  figures: ExtractedFigure[];
  tables: ExtractedTable[];
  equations: ExtractedEquation[];
  references: ExtractedReference[];
  error?: string;
}

export async function extractPdfFromUrl(
  pdfUrl: string
): Promise<PdfExtractionResult> {
  try {
    const response = await fetch(`${PDF_EXTRACTOR_URL}/extract-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: pdfUrl }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        sections: [],
        figures: [],
        tables: [],
        equations: [],
        references: [],
        error: `PDF extraction service error: ${response.status} - ${errorText}`,
      };
    }

    const data: PdfExtractionResponse = await response.json();

    if (data.error) {
      return {
        sections: [],
        figures: [],
        tables: [],
        equations: [],
        references: [],
        error: data.error,
      };
    }

    return {
      fullText: data.fullText,
      sections: data.sections,
      figures: data.figures,
      tables: data.tables,
      equations: data.equations,
      references: data.references,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error during PDF extraction";
    return {
      sections: [],
      figures: [],
      tables: [],
      equations: [],
      references: [],
      error: errorMessage,
    };
  }
}

export async function extractPdfBatch(
  pdfUrls: string[]
): Promise<PdfExtractionResult[]> {
  try {
    const response = await fetch(`${PDF_EXTRACTOR_URL}/extract-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pdfUrls),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return pdfUrls.map(() => ({
        sections: [],
        figures: [],
        tables: [],
        equations: [],
        references: [],
        error: `PDF extraction service error: ${response.status} - ${errorText}`,
      }));
    }

    const results: PdfExtractionResponse[] = await response.json();

    return results.map((data) => ({
      fullText: data.fullText,
      sections: data.sections,
      figures: data.figures,
      tables: data.tables,
      equations: data.equations,
      references: data.references,
      error: data.error,
    }));
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error during batch PDF extraction";
    return pdfUrls.map(() => ({
      sections: [],
      figures: [],
      tables: [],
      equations: [],
      references: [],
      error: errorMessage,
    }));
  }
}

export async function checkPdfServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PDF_EXTRACTOR_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
