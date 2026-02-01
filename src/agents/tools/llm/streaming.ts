import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";
import {
  getOpenRouterConfig,
  OPENROUTER_API_URL,
  MODELS,
  type ChatMessage,
} from "./openrouter";

interface StreamingChatResult {
  content: string;
  model: string;
  finishReason: string;
  chunks: number;
}

const StreamingChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      })
    )
    .describe("The conversation messages"),
  model: z.string().optional().describe("Model to use"),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().min(1).max(128000).optional().default(4096),
  onChunk: z
    .function()
    .optional()
    .describe(
      "Callback for each chunk (not serializable - for programmatic use)"
    ),
});

interface StreamEvent {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

async function* streamChat(
  messages: ChatMessage[],
  model: string,
  temperature: number,
  maxTokens: number
): AsyncGenerator<{ chunk: string; done: boolean; finishReason?: string }> {
  const config = getOpenRouterConfig();

  const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "HTTP-Referer": config.siteUrl || "",
      "X-Title": config.siteName || "",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed === "data: [DONE]") {
          continue;
        }

        if (trimmed.startsWith("data: ")) {
          try {
            const event: StreamEvent = JSON.parse(trimmed.slice(6));
            const choice = event.choices[0];

            if (choice?.delta?.content) {
              yield {
                chunk: choice.delta.content,
                done: false,
              };
            }

            if (choice?.finish_reason) {
              yield {
                chunk: "",
                done: true,
                finishReason: choice.finish_reason,
              };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const streamingChatTool = tool(
  async (input): Promise<ToolResult<StreamingChatResult>> => {
    const startTime = Date.now();
    try {
      const model = input.model || MODELS.CLAUDE_3_5_SONNET;
      let content = "";
      let chunks = 0;
      let finishReason = "unknown";

      for await (const event of streamChat(
        input.messages,
        model,
        input.temperature,
        input.maxTokens
      )) {
        if (event.chunk) {
          content += event.chunk;
          chunks++;

          // Call the optional callback if provided
          if (input.onChunk) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (input.onChunk as any)(event.chunk);
          }
        }

        if (event.done && event.finishReason) {
          finishReason = event.finishReason;
        }
      }

      return wrapToolSuccess(
        {
          content,
          model,
          finishReason,
          chunks,
        },
        startTime,
        { source: "openrouter" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "streaming_chat",
    description:
      "Generates a streaming chat completion. Returns the full response after streaming completes.",
    schema: StreamingChatSchema,
  }
);

// Export the raw streaming function for programmatic use
export { streamChat };

export const streamingTools = [streamingChatTool];
