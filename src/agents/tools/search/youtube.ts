import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface YouTubeTranscriptResponse {
  videoId: string;
  title?: string;
  segments: TranscriptSegment[];
  fullText: string;
}

function extractVideoId(urlOrId: string): string {
  if (urlOrId.length === 11 && !urlOrId.includes("/")) {
    return urlOrId;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match) {
      return match[1];
    }
  }

  throw new Error(`Could not extract video ID from: ${urlOrId}`);
}

const YouTubeTranscriptSchema = z.object({
  videoUrlOrId: z
    .string()
    .describe("YouTube video URL or video ID (e.g., 'dQw4w9WgXcQ')"),
  language: z
    .string()
    .optional()
    .default("en")
    .describe("Language code for transcript (e.g., 'en', 'es', 'fr')"),
});

export const youtubeTranscriptTool = tool(
  async (input): Promise<ToolResult<YouTubeTranscriptResponse>> => {
    const startTime = Date.now();
    try {
      const videoId = extractVideoId(input.videoUrlOrId);

      // Dynamic import since this is an optional dependency
      const ytModule = await import("@playzone/youtube-transcript");
      // Handle both default and named export patterns
      const YoutubeTranscript =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ytModule as any).YoutubeTranscript ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ytModule as any).default?.YoutubeTranscript ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ytModule as any).default;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcriptItems: any[] = await YoutubeTranscript.fetchTranscript(
        videoId,
        {
          lang: input.language,
        }
      );

      const segments: TranscriptSegment[] = transcriptItems.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => ({
          text: item.text,
          start: item.offset / 1000,
          duration: item.duration / 1000,
        })
      );

      const fullText = segments.map((s) => s.text).join(" ");

      return wrapToolSuccess(
        {
          videoId,
          segments,
          fullText,
        },
        startTime,
        { source: "youtube" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "youtube_transcript",
    description:
      "Fetches the transcript/captions of a YouTube video for analysis",
    schema: YouTubeTranscriptSchema,
  }
);

export const youtubeTools = [youtubeTranscriptTool];
