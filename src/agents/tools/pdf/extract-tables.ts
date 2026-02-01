import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";
import { downloadPdfBuffer } from "./download";

interface ExtractedTable {
  reference: string;
  caption: string;
  pageNumber?: number;
  context?: string;
  headers?: string[];
}

interface ExtractTablesResult {
  tables: ExtractedTable[];
  totalPages: number;
}

const ExtractTablesSchema = z.object({
  url: z.string().url().describe("URL of the PDF to extract tables from"),
  timeout: z.number().int().min(1000).max(120000).optional().default(60000),
});

// Regex patterns for table detection
const TABLE_PATTERNS = [
  // Table N: Caption or Tab. N: Caption
  /(?:Table|Tab\.?)\s+(\d+(?:\.\d+)?)\s*[:\.]?\s*([^\n]+)/gi,
  // Table N. Caption (with period separator)
  /(?:Table|Tab\.?)\s+(\d+(?:\.\d+)?)\.\s+([^\n]+)/gi,
  // (Table N) - parenthetical references
  /\((?:Table|Tab\.?)\s+(\d+(?:\.\d+)?)\)/gi,
];

const CAPTION_PATTERNS = [
  // Caption starting with Table or Tab
  /^(?:Table|Tab\.?)\s+(\d+(?:\.\d+)?)[:\.]?\s*(.+)$/i,
];

function extractTablesFromText(text: string): ExtractedTable[] {
  const tables: Map<string, ExtractedTable> = new Map();

  // Split into pages (rough approximation)
  const pages = text.split(/\f|\n{4,}/);

  pages.forEach((pageText, pageIndex) => {
    const pageNumber = pageIndex + 1;

    // Look for table references with captions
    for (const pattern of TABLE_PATTERNS) {
      let match;
      while ((match = pattern.exec(pageText)) !== null) {
        const reference = `Table ${match[1]}`;
        const caption = match[2]?.trim() || "";

        if (!tables.has(reference)) {
          // Get surrounding context (up to 300 chars after for potential headers)
          const startIdx = Math.max(0, match.index - 100);
          const endIdx = Math.min(
            pageText.length,
            match.index + match[0].length + 300
          );
          const context = pageText
            .slice(startIdx, endIdx)
            .replace(/\s+/g, " ")
            .trim();

          // Try to extract headers from context
          const headers = extractPotentialHeaders(context);

          tables.set(reference, {
            reference,
            caption: cleanCaption(caption),
            pageNumber,
            context,
            headers: headers.length > 0 ? headers : undefined,
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
        const reference = `Table ${match[1]}`;
        const caption = match[2]?.trim() || "";

        if (!tables.has(reference) || !tables.get(reference)?.caption) {
          const context = lines
            .slice(i, Math.min(lines.length, i + 10))
            .join(" ");
          const headers = extractPotentialHeaders(context);

          tables.set(reference, {
            reference,
            caption: cleanCaption(caption),
            context,
            headers: headers.length > 0 ? headers : undefined,
          });
        }
      }
    }
  }

  return Array.from(tables.values()).sort((a, b) => {
    const numA = parseFloat(a.reference.replace(/[^\d.]/g, ""));
    const numB = parseFloat(b.reference.replace(/[^\d.]/g, ""));
    return numA - numB;
  });
}

function extractPotentialHeaders(text: string): string[] {
  // Look for patterns that might be table headers
  // This is a heuristic approach - proper table extraction would need OCR

  // Split by common delimiters
  const lines = text.split(/\n/);

  for (const line of lines) {
    // Look for lines with multiple capitalized words separated by spaces/tabs
    const words = line.split(/\s{2,}|\t/).filter((w) => w.trim().length > 0);

    if (words.length >= 2 && words.length <= 10) {
      // Check if most words start with capital letters (header-like)
      const capitalizedCount = words.filter((w) =>
        /^[A-Z]/.test(w.trim())
      ).length;

      if (capitalizedCount >= words.length * 0.5) {
        return words.map((w) => w.trim());
      }
    }
  }

  return [];
}

function cleanCaption(caption: string): string {
  return caption
    .replace(/\s+/g, " ")
    .replace(/^[:\.\s]+/, "")
    .trim();
}

export const extractPdfTablesTool = tool(
  async (input): Promise<ToolResult<ExtractTablesResult>> => {
    const startTime = Date.now();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = (await import("pdf-parse")) as any;
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const downloadResult = await downloadPdfBuffer(input.url, input.timeout);
      const data = await pdfParse(downloadResult.buffer);

      const tables = extractTablesFromText(data.text);

      return wrapToolSuccess(
        {
          tables,
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
    name: "extract_pdf_tables",
    description:
      "Extracts table references and captions from a PDF. Uses text analysis to find tables.",
    schema: ExtractTablesSchema,
  }
);

export const extractTableTools = [extractPdfTablesTool];
