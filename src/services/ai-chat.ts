// ============================================================================
// AI Chat Service — Anthropic & OpenAI Support
// Handles API calls to AI providers for chat functionality
//
// In production (Vercel): requests go to /api/anthropic and /api/openai
// serverless functions which inject API keys server-side.
// In development: Vite proxy forwards the same paths to the real APIs.
// ============================================================================

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AIConfig {
  provider: "anthropic" | "openai";
  model: string;
}

function getConfig(): AIConfig {
  const provider = (import.meta.env.VITE_AI_PROVIDER || "anthropic") as "anthropic" | "openai";

  if (provider === "openai") {
    return {
      provider,
      model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o",
    };
  }

  return {
    provider: "anthropic",
    model: import.meta.env.VITE_ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  };
}

export function isAIConfigured(): boolean {
  // API keys are handled server-side by Vercel serverless functions (production)
  // or by the Vite dev proxy (development). The client doesn't need keys.
  return true;
}

async function callAnthropic(
  messages: ChatMessage[],
  systemPrompt: string,
  config: AIConfig,
): Promise<string> {
  const apiMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const response = await fetch(`/api/anthropic/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "I apologize, I could not generate a response.";
}

async function callOpenAI(
  messages: ChatMessage[],
  systemPrompt: string,
  config: AIConfig,
): Promise<string> {
  const apiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch(`/api/openai/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: apiMessages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I apologize, I could not generate a response.";
}

export async function sendMessage(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<string> {
  const config = getConfig();

  if (config.provider === "openai") {
    return callOpenAI(messages, systemPrompt, config);
  }
  return callAnthropic(messages, systemPrompt, config);
}

export function getProviderName(): string {
  const config = getConfig();
  if (config.provider === "openai") return `OpenAI (${config.model})`;
  return `Anthropic (${config.model})`;
}
