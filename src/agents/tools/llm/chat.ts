import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";
import { createChatCompletion, MODELS, type ChatMessage } from "./openrouter";

interface ChatCompletionResult {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const ChatCompletionSchema = z.object({
  messages: z.array(ChatMessageSchema).describe("The conversation messages"),
  model: z
    .string()
    .optional()
    .describe(
      "Model to use (e.g., 'anthropic/claude-3.5-sonnet'). Defaults to Claude 3.5 Sonnet."
    ),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .default(0.7)
    .describe("Sampling temperature"),
  maxTokens: z
    .number()
    .int()
    .min(1)
    .max(128000)
    .optional()
    .default(4096)
    .describe("Maximum tokens in response"),
  systemPrompt: z
    .string()
    .optional()
    .describe(
      "System prompt to prepend to messages (convenience parameter)"
    ),
});

export const chatCompletionTool = tool(
  async (input): Promise<ToolResult<ChatCompletionResult>> => {
    const startTime = Date.now();
    try {
      const messages: ChatMessage[] = [...input.messages];

      if (input.systemPrompt) {
        messages.unshift({
          role: "system",
          content: input.systemPrompt,
        });
      }

      const response = await createChatCompletion({
        messages,
        model: input.model || MODELS.CLAUDE_3_5_SONNET,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error("No response received from model");
      }

      return wrapToolSuccess(
        {
          content: choice.message.content,
          model: response.model,
          usage: response.usage,
          finishReason: choice.finishReason,
        },
        startTime,
        { source: "openrouter" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "chat_completion",
    description:
      "Generates a chat completion using an LLM via OpenRouter. Supports multiple models.",
    schema: ChatCompletionSchema,
  }
);

const SimpleCompletionSchema = z.object({
  prompt: z.string().describe("The prompt to complete"),
  model: z.string().optional().describe("Model to use"),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().min(1).max(128000).optional().default(4096),
  systemPrompt: z.string().optional().describe("Optional system prompt"),
});

export const simpleCompletionTool = tool(
  async (input): Promise<ToolResult<string>> => {
    const startTime = Date.now();
    try {
      const messages: ChatMessage[] = [];

      if (input.systemPrompt) {
        messages.push({
          role: "system",
          content: input.systemPrompt,
        });
      }

      messages.push({
        role: "user",
        content: input.prompt,
      });

      const response = await createChatCompletion({
        messages,
        model: input.model || MODELS.CLAUDE_3_5_SONNET,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error("No response received from model");
      }

      return wrapToolSuccess(choice.message.content, startTime, {
        source: "openrouter",
      });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "simple_completion",
    description:
      "Simple prompt completion - takes a prompt and returns the LLM response",
    schema: SimpleCompletionSchema,
  }
);

export const chatTools = [chatCompletionTool, simpleCompletionTool];
