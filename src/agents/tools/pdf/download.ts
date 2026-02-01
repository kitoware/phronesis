import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

interface DownloadResult {
  buffer: Buffer;
  contentType: string;
  contentLength: number;
  url: string;
}

const DownloadPdfSchema = z.object({
  url: z.string().url().describe("URL of the PDF to download"),
  timeout: z
    .number()
    .int()
    .min(1000)
    .max(120000)
    .optional()
    .default(30000)
    .describe("Download timeout in milliseconds"),
});

export async function downloadPdfBuffer(
  url: string,
  timeout: number = 30000
): Promise<DownloadResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PhronesisBot/1.0; +https://phronesis.ai)",
        Accept: "application/pdf,*/*",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("pdf") &&
      !contentType.includes("octet-stream") &&
      !url.endsWith(".pdf")
    ) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      buffer,
      contentType,
      contentLength: buffer.length,
      url,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const downloadPdfTool = tool(
  async (input): Promise<ToolResult<{ size: number; url: string }>> => {
    const startTime = Date.now();
    try {
      const result = await downloadPdfBuffer(input.url, input.timeout);

      // Return metadata only - buffer is too large for tool result
      return wrapToolSuccess(
        {
          size: result.contentLength,
          url: result.url,
        },
        startTime,
        { source: "pdf" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "download_pdf",
    description:
      "Downloads a PDF from a URL. Returns metadata about the download.",
    schema: DownloadPdfSchema,
  }
);

export const downloadTools = [downloadPdfTool];
