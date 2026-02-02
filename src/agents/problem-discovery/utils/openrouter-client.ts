export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatParams {
  model: string;
  messages: Message[];
  response_format?: { type: "json_object" };
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const openrouter = {
  async chat(params: ChatParams): Promise<ChatResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    const {
      model,
      messages,
      response_format,
      temperature = 0.7,
      max_tokens = 4096,
    } = params;

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Phronesis Research Platform",
      },
      body: JSON.stringify({
        model,
        messages,
        response_format,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  },

  async chatWithRetry(
    params: ChatParams,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<ChatResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.chat(params);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new Error("Unknown error in chatWithRetry");
  },
};

export const MODELS = {
  CLAUDE_3_5_SONNET: "anthropic/claude-3.5-sonnet",
  CLAUDE_3_HAIKU: "anthropic/claude-3-haiku",
  GPT_4O: "openai/gpt-4o",
  GPT_4O_MINI: "openai/gpt-4o-mini",
} as const;
