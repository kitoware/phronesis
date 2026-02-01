import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";
import { downloadPdfBuffer } from "./download";

interface ExtractedText {
  text: string;
  pages: number;
  info: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
  metadata: Record<string, unknown>;
}

const ExtractTextSchema = z.object({
  url: z.string().url().describe("URL of the PDF to extract text from"),
  maxPages: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Maximum number of pages to extract (all if not specified)"),
  timeout: z
    .number()
    .int()
    .min(1000)
    .max(120000)
    .optional()
    .default(60000)
    .describe("Total timeout in milliseconds"),
});

export const extractPdfTextTool = tool(
  async (input): Promise<ToolResult<ExtractedText>> => {
    const startTime = Date.now();
    try {
      // Dynamic import for pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = (await import("pdf-parse")) as any;
      const pdfParse = pdfParseModule.default || pdfParseModule;

      const downloadResult = await downloadPdfBuffer(input.url, input.timeout);

      const options: { max?: number } = {};
      if (input.maxPages) {
        options.max = input.maxPages;
      }

      const data = await pdfParse(downloadResult.buffer, options);

      return wrapToolSuccess(
        {
          text: data.text,
          pages: data.numpages,
          info: {
            title: data.info?.Title,
            author: data.info?.Author,
            subject: data.info?.Subject,
            creator: data.info?.Creator,
            producer: data.info?.Producer,
            creationDate: data.info?.CreationDate,
            modificationDate: data.info?.ModDate,
          },
          metadata: data.metadata || {},
        },
        startTime,
        { source: "pdf" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "extract_pdf_text",
    description:
      "Extracts text content from a PDF. Includes document metadata.",
    schema: ExtractTextSchema,
  }
);

const ExtractTextFromBufferSchema = z.object({
  buffer: z
    .instanceof(Buffer)
    .describe("PDF buffer (for programmatic use only)"),
  maxPages: z.number().int().min(1).optional(),
});

export const extractPdfTextFromBufferTool = tool(
  async (input): Promise<ToolResult<ExtractedText>> => {
    const startTime = Date.now();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = (await import("pdf-parse")) as any;
      const pdfParse = pdfParseModule.default || pdfParseModule;

      const options: { max?: number } = {};
      if (input.maxPages) {
        options.max = input.maxPages;
      }

      const data = await pdfParse(input.buffer, options);

      return wrapToolSuccess(
        {
          text: data.text,
          pages: data.numpages,
          info: {
            title: data.info?.Title,
            author: data.info?.Author,
            subject: data.info?.Subject,
            creator: data.info?.Creator,
            producer: data.info?.Producer,
            creationDate: data.info?.CreationDate,
            modificationDate: data.info?.ModDate,
          },
          metadata: data.metadata || {},
        },
        startTime,
        { source: "pdf" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "extract_pdf_text_from_buffer",
    description:
      "Extracts text from a PDF buffer. For programmatic use when you already have the PDF data.",
    schema: ExtractTextFromBufferSchema,
  }
);

export const extractTextTools = [
  extractPdfTextTool,
  extractPdfTextFromBufferTool,
];
