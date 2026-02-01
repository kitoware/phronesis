import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";
import { downloadPdfBuffer } from "./download";

interface ExtractedFigure {
  reference: string;
  caption: string;
  pageNumber?: number;
  context?: string;
}

interface ExtractFiguresResult {
  figures: ExtractedFigure[];
  totalPages: number;
}

const ExtractFiguresSchema = z.object({
  url: z.string().url().describe("URL of the PDF to extract figures from"),
  timeout: z.number().int().min(1000).max(120000).optional().default(60000),
});

// Regex patterns for figure detection
const FIGURE_PATTERNS = [
  // Figure N: Caption or Fig. N: Caption
  /(?:Figure|Fig\.?)\s+(\d+(?:\.\d+)?)\s*[:\.]?\s*([^\n]+)/gi,
  // Figure N. Caption (with period separator)
  /(?:Figure|Fig\.?)\s+(\d+(?:\.\d+)?)\.\s+([^\n]+)/gi,
  // (Figure N) or (Fig. N) - parenthetical references
  /\((?:Figure|Fig\.?)\s+(\d+(?:\.\d+)?)\)/gi,
];

const CAPTION_PATTERNS = [
  // Caption starting with Figure or Fig
  /^(?:Figure|Fig\.?)\s+(\d+(?:\.\d+)?)[:\.]?\s*(.+)$/i,
];

function extractFiguresFromText(text: string): ExtractedFigure[] {
  const figures: Map<string, ExtractedFigure> = new Map();

  // Split into pages (rough approximation)
  const pages = text.split(/\f|\n{4,}/);

  pages.forEach((pageText, pageIndex) => {
    const pageNumber = pageIndex + 1;

    // Look for figure references with captions
    for (const pattern of FIGURE_PATTERNS) {
      let match;
      while ((match = pattern.exec(pageText)) !== null) {
        const reference = `Figure ${match[1]}`;
        const caption = match[2]?.trim() || "";

        if (!figures.has(reference)) {
          // Get surrounding context (up to 200 chars before and after)
          const startIdx = Math.max(0, match.index - 200);
          const endIdx = Math.min(
            pageText.length,
            match.index + match[0].length + 200
          );
          const context = pageText
            .slice(startIdx, endIdx)
            .replace(/\s+/g, " ")
            .trim();

          figures.set(reference, {
            reference,
            caption: cleanCaption(caption),
            pageNumber,
            context,
          });
        }
      }
    }
  });

  // Also look for standalone captions
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    for (const pattern of CAPTION_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const reference = `Figure ${match[1]}`;
        const caption = match[2]?.trim() || "";

        if (!figures.has(reference) || !figures.get(reference)?.caption) {
          figures.set(reference, {
            reference,
            caption: cleanCaption(caption),
            context: lines.slice(Math.max(0, i - 2), i + 3).join(" "),
          });
        }
      }
    }
  }

  return Array.from(figures.values()).sort((a, b) => {
    const numA = parseFloat(a.reference.replace(/[^\d.]/g, ""));
    const numB = parseFloat(b.reference.replace(/[^\d.]/g, ""));
    return numA - numB;
  });
}

function cleanCaption(caption: string): string {
  return caption
    .replace(/\s+/g, " ")
    .replace(/^[:\.\s]+/, "")
    .trim();
}

export const extractPdfFiguresTool = tool(
  async (input): Promise<ToolResult<ExtractFiguresResult>> => {
    const startTime = Date.now();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = (await import("pdf-parse")) as any;
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const downloadResult = await downloadPdfBuffer(input.url, input.timeout);
      const data = await pdfParse(downloadResult.buffer);

      const figures = extractFiguresFromText(data.text);

      return wrapToolSuccess(
        {
          figures,
          totalPages: data.numpages,
        },
        startTime,
        { source: "pdf" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "extract_pdf_figures",
    description:
      "Extracts figure references and captions from a PDF. Uses text analysis to find figures.",
    schema: ExtractFiguresSchema,
  }
);

export const extractFigureTools = [extractPdfFiguresTool];
