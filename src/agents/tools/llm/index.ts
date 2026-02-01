export {
  configureOpenRouter,
  getOpenRouterConfig,
  getOpenRouterApiKey,
  createChatCompletion,
  MODELS,
  OPENROUTER_API_URL,
  type OpenRouterConfig,
  type ModelConfig,
  type ModelId,
  type ChatMessage,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
} from "./openrouter";

import { chatCompletionTool, simpleCompletionTool, chatTools } from "./chat";

import {
  structuredOutputTool,
  PREDEFINED_SCHEMAS,
  structuredTools,
} from "./structured";

import { streamingChatTool, streamChat, streamingTools } from "./streaming";

// Re-export all
export {
  chatCompletionTool,
  simpleCompletionTool,
  chatTools,
  structuredOutputTool,
  PREDEFINED_SCHEMAS,
  structuredTools,
  streamingChatTool,
  streamChat,
  streamingTools,
};

// Aggregate all LLM tools
export const allLlmTools = [
  ...chatTools,
  ...structuredTools,
  ...streamingTools,
];
