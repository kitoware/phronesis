const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

export interface OpenRouterConfig {
  apiKey: string;
  siteUrl?: string;
  siteName?: string;
  defaultModel?: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  contextWindow: number;
  pricePerInputToken: number;
  pricePerOutputToken: number;
}

// Popular models available via OpenRouter
export const MODELS = {
  // Claude models
  CLAUDE_3_5_SONNET: "anthropic/claude-3.5-sonnet",
  CLAUDE_3_OPUS: "anthropic/claude-3-opus",
  CLAUDE_3_HAIKU: "anthropic/claude-3-haiku",

  // GPT models
  GPT_4_TURBO: "openai/gpt-4-turbo",
  GPT_4O: "openai/gpt-4o",
  GPT_4O_MINI: "openai/gpt-4o-mini",

  // Open source models
  LLAMA_3_1_405B: "meta-llama/llama-3.1-405b-instruct",
  LLAMA_3_1_70B: "meta-llama/llama-3.1-70b-instruct",
  MIXTRAL_8X22B: "mistralai/mixtral-8x22b-instruct",

  // Fast/cheap models
  GEMINI_FLASH: "google/gemini-flash-1.5",
  GEMINI_PRO: "google/gemini-pro-1.5",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

let globalConfig: OpenRouterConfig | null = null;

export function getOpenRouterApiKey(): string {
  if (globalConfig?.apiKey) {
    return globalConfig.apiKey;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  return apiKey;
}

export function configureOpenRouter(config: OpenRouterConfig): void {
  globalConfig = config;
}

export function getOpenRouterConfig(): OpenRouterConfig {
  return {
    apiKey: getOpenRouterApiKey(),
    siteUrl: globalConfig?.siteUrl || process.env.SITE_URL,
    siteName: globalConfig?.siteName || "Phronesis",
    defaultModel: globalConfig?.defaultModel || MODELS.CLAUDE_3_5_SONNET,
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finishReason: string;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export async function createChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
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
      model: request.model || config.defaultModel,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
      stop: request.stop,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    model: data.model,
    choices: data.choices.map(
      (choice: {
        index: number;
        message: { role: string; content: string };
        finish_reason: string;
      }) => ({
        index: choice.index,
        message: {
          role: choice.message.role as "system" | "user" | "assistant",
          content: choice.message.content,
        },
        finishReason: choice.finish_reason,
      })
    ),
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

export { OPENROUTER_API_URL };
