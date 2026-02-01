import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";
import { downloadPdfBuffer } from "./download";

interface ExtractedReference {
  index: number;
  raw: string;
  title?: string;
  authors?: string[];
  year?: string;
  venue?: string;
  doi?: string;
  arxivId?: string;
  url?: string;
}

interface ExtractRefsResult {
  references: ExtractedReference[];
  totalFound: number;
}

const ExtractRefsSchema = z.object({
  url: z.string().url().describe("URL of the PDF to extract references from"),
  timeout: z.number().int().min(1000).max(120000).optional().default(60000),
});

// Common patterns for reference sections
const REFERENCE_SECTION_PATTERNS = [
  /(?:^|\n)(?:REFERENCES|References|BIBLIOGRAPHY|Bibliography)\s*\n/i,
  /(?:^|\n)\d+\s*(?:REFERENCES|References)\s*\n/i,
];

// Patterns for extracting reference details
const YEAR_PATTERN = /\((\d{4})\)|,\s*(\d{4})\b|\b(\d{4})\./;
const DOI_PATTERN = /(?:doi:\s*|https?:\/\/doi\.org\/)(10\.\d+\/[^\s]+)/i;
const ARXIV_PATTERN =
  /(?:arxiv:\s*|arxiv\.org\/(?:abs|pdf)\/)?(\d{4}\.\d{4,5}(?:v\d+)?)/i;
const URL_PATTERN = /(https?:\/\/[^\s]+)/i;

function findReferencesSection(text: string): string {
  for (const pattern of REFERENCE_SECTION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      // Return everything after the references header
      return text.slice(match.index + match[0].length);
    }
  }

  // Fallback: look for numbered references near the end
  const lastPortion = text.slice(-Math.floor(text.length * 0.3));
  const numberedRefMatch = lastPortion.match(/\n\s*\[1\]|\n\s*1\./);
  if (numberedRefMatch && numberedRefMatch.index !== undefined) {
    return lastPortion.slice(numberedRefMatch.index);
  }

  return "";
}

function parseReferences(refsText: string): ExtractedReference[] {
  const references: ExtractedReference[] = [];

  // Split by numbered reference patterns
  const patterns = [
    /\n\s*\[(\d+)\]/g, // [1], [2], ...
    /\n\s*(\d+)\.\s+/g, // 1. 2. ...
    /\n\s*\((\d+)\)/g, // (1), (2), ...
  ];

  let refParts: string[] = [];

  for (const pattern of patterns) {
    const splits = refsText.split(pattern);
    if (splits.length > 2) {
      refParts = splits;
      break;
    }
  }

  if (refParts.length === 0) {
    // Try splitting by double newlines as fallback
    refParts = refsText.split(/\n\n+/).filter((p) => p.trim().length > 20);
  }

  // Process each reference
  let index = 1;
  for (let i = 0; i < refParts.length; i++) {
    const part = refParts[i].trim();

    // Skip empty parts or just numbers
    if (!part || /^\d+$/.test(part)) {
      if (/^\d+$/.test(part)) {
        index = parseInt(part, 10);
      }
      continue;
    }

    // Skip if too short to be a real reference
    if (part.length < 20) continue;

    const ref = parseReferenceText(part, index);
    if (ref.raw.length > 10) {
      references.push(ref);
      index++;
    }
  }

  return references;
}

function parseReferenceText(text: string, index: number): ExtractedReference {
  const raw = text.replace(/\s+/g, " ").trim();

  const ref: ExtractedReference = {
    index,
    raw,
  };

  // Extract year
  const yearMatch = text.match(YEAR_PATTERN);
  if (yearMatch) {
    ref.year = yearMatch[1] || yearMatch[2] || yearMatch[3];
  }

  // Extract DOI
  const doiMatch = text.match(DOI_PATTERN);
  if (doiMatch) {
    ref.doi = doiMatch[1];
  }

  // Extract arXiv ID
  const arxivMatch = text.match(ARXIV_PATTERN);
  if (arxivMatch) {
    ref.arxivId = arxivMatch[1];
  }

  // Extract URL
  const urlMatch = text.match(URL_PATTERN);
  if (urlMatch && !doiMatch) {
    ref.url = urlMatch[1];
  }

  // Try to extract title (usually in quotes or italics - hard to detect)
  const quoteMatch = text.match(/"([^"]+)"|"([^"]+)"/);
  if (quoteMatch) {
    ref.title = quoteMatch[1] || quoteMatch[2];
  }

  // Try to extract authors (names before year)
  if (ref.year) {
    const beforeYear = text.split(ref.year)[0];
    if (beforeYear) {
      // Simple heuristic: extract capitalized names
      const authors = extractAuthors(beforeYear);
      if (authors.length > 0) {
        ref.authors = authors;
      }
    }
  }

  return ref;
}

function extractAuthors(text: string): string[] {
  // Remove common patterns
  const cleaned = text
    .replace(/\[?\d+\]?\.?/g, "")
    .replace(/^\s*,\s*/, "")
    .trim();

  // Split by common author separators
  const parts = cleaned.split(/\s*(?:,\s*and\s*|,\s*&\s*|\s+and\s+|\s*,\s*)/i);

  const authors: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    // Basic name validation: should have capital letters and be reasonable length
    if (
      trimmed.length > 2 &&
      trimmed.length < 100 &&
      /[A-Z]/.test(trimmed) &&
      !/^\d+$/.test(trimmed) &&
      !trimmed.toLowerCase().startsWith("in ")
    ) {
      authors.push(trimmed);
    }
  }

  return authors.slice(0, 10); // Limit to prevent runaway extraction
}

export const extractPdfRefsTool = tool(
  async (input): Promise<ToolResult<ExtractRefsResult>> => {
    const startTime = Date.now();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = (await import("pdf-parse")) as any;
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const downloadResult = await downloadPdfBuffer(input.url, input.timeout);
      const data = await pdfParse(downloadResult.buffer);

      const refsSection = findReferencesSection(data.text);
      const references = parseReferences(refsSection);

      return wrapToolSuccess(
        {
          references,
          totalFound: references.length,
        },
        startTime,
        { source: "pdf" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "extract_pdf_refs",
    description:
      "Extracts bibliographic references from a PDF's reference section. Attempts to parse authors, year, DOI, and arXiv IDs.",
    schema: ExtractRefsSchema,
  }
);

export const extractRefTools = [extractPdfRefsTool];
