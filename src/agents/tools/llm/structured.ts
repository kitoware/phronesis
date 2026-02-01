import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";
import { createChatCompletion, MODELS, type ChatMessage } from "./openrouter";

interface StructuredOutputResult<T = unknown> {
  data: T;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const StructuredOutputSchema = z.object({
  prompt: z.string().describe("The prompt describing what to extract/generate"),
  schema: z
    .record(z.string(), z.unknown())
    .describe("JSON schema describing the expected output structure"),
  context: z
    .string()
    .optional()
    .describe("Additional context or data to analyze"),
  model: z.string().optional().describe("Model to use"),
  temperature: z.number().min(0).max(1).optional().default(0),
});

function buildStructuredPrompt(
  prompt: string,
  schema: Record<string, unknown>,
  context?: string
): string {
  const schemaStr = JSON.stringify(schema, null, 2);

  let fullPrompt = `${prompt}\n\n`;

  if (context) {
    fullPrompt += `Context/Data:\n${context}\n\n`;
  }

  fullPrompt += `You MUST respond with valid JSON matching this schema:\n\`\`\`json\n${schemaStr}\n\`\`\`\n\n`;
  fullPrompt += `Respond ONLY with the JSON object, no additional text or markdown formatting.`;

  return fullPrompt;
}

function extractJson(text: string): unknown {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }

  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }

  throw new Error("Could not extract JSON from response");
}

export const structuredOutputTool = tool(
  async (input): Promise<ToolResult<StructuredOutputResult>> => {
    const startTime = Date.now();
    try {
      const fullPrompt = buildStructuredPrompt(
        input.prompt,
        input.schema,
        input.context
      );

      const messages: ChatMessage[] = [
        {
          role: "system",
          content:
            "You are a helpful assistant that always responds with valid JSON matching the provided schema. Never include explanations or markdown formatting - only the JSON object.",
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ];

      const response = await createChatCompletion({
        messages,
        model: input.model || MODELS.CLAUDE_3_5_SONNET,
        temperature: input.temperature,
        maxTokens: 8192,
      });

      const choice = response.choices[0];
      if (!choice) {
        throw new Error("No response received from model");
      }

      const data = extractJson(choice.message.content);

      return wrapToolSuccess(
        {
          data,
          model: response.model,
          usage: response.usage,
        },
        startTime,
        { source: "openrouter" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "structured_output",
    description:
      "Generates structured JSON output matching a provided schema. Uses an LLM to extract or generate data in a specific format.",
    schema: StructuredOutputSchema,
  }
);

// Predefined schemas for common extraction tasks

export const PREDEFINED_SCHEMAS = {
  PAPER_SUMMARY: {
    type: "object",
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      keyFindings: { type: "array", items: { type: "string" } },
      methodology: { type: "string" },
      limitations: { type: "array", items: { type: "string" } },
      futureWork: { type: "array", items: { type: "string" } },
    },
    required: ["title", "summary", "keyFindings", "methodology"],
  },

  STARTUP_PROBLEM: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      category: {
        type: "string",
        enum: [
          "technical",
          "operational",
          "market",
          "product",
          "scaling",
          "other",
        ],
      },
      severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
      evidence: {
        type: "array",
        items: {
          type: "object",
          properties: {
            source: { type: "string" },
            excerpt: { type: "string" },
          },
        },
      },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["title", "description", "category", "severity"],
  },

  RESEARCH_LINK: {
    type: "object",
    properties: {
      relevanceScore: { type: "number", minimum: 0, maximum: 1 },
      matchType: {
        type: "string",
        enum: ["direct", "methodology", "tangential", "inspiration"],
      },
      matchRationale: { type: "string" },
      keyInsights: { type: "array", items: { type: "string" } },
      applicationSuggestions: { type: "array", items: { type: "string" } },
      confidence: { type: "number", minimum: 0, maximum: 1 },
    },
    required: [
      "relevanceScore",
      "matchType",
      "matchRationale",
      "keyInsights",
      "applicationSuggestions",
      "confidence",
    ],
  },

  ENTITIES: {
    type: "object",
    properties: {
      people: { type: "array", items: { type: "string" } },
      organizations: { type: "array", items: { type: "string" } },
      technologies: { type: "array", items: { type: "string" } },
      concepts: { type: "array", items: { type: "string" } },
      locations: { type: "array", items: { type: "string" } },
    },
    required: ["people", "organizations", "technologies", "concepts"],
  },
};

export const structuredTools = [structuredOutputTool];
