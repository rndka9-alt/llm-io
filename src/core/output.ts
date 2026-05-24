import type { LlmToolCall, LlmToolCallPart } from "./message";

export interface LlmAssistantMessage {
  role: "assistant";
  content: readonly LlmAssistantContentPart[];
  text: string;
  toolCalls?: readonly LlmToolCall[];
}

export type LlmAssistantContentPart = LlmAssistantTextPart | LlmAssistantToolCallPart;

export interface LlmAssistantTextPart {
  type: "text";
  text: string;
}

export type LlmAssistantToolCallPart = LlmToolCallPart;

export interface LlmReasoning {
  text: string;
}

export interface LlmUsage {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
}

export type LlmFinishReason = "stop" | "length" | "tool-call" | "content-filter" | "unknown";

export interface LlmOutput<TRaw, TExtras = undefined> {
  message: LlmAssistantMessage;
  reasoning?: LlmReasoning;
  toolCalls?: readonly LlmToolCall[];
  usage?: LlmUsage;
  finishReason?: LlmFinishReason;
  raw: TRaw;
  extras?: TExtras;
}

export function createTextAssistantMessage(text: string): LlmAssistantMessage {
  return createAssistantMessage(text, []);
}

export function createAssistantMessage(
  text: string,
  toolCalls: readonly LlmToolCall[],
): LlmAssistantMessage {
  const content: LlmAssistantContentPart[] = [];

  if (text.length > 0) {
    content.push({ type: "text", text });
  }

  for (const toolCall of toolCalls) {
    content.push({ type: "tool-call", ...toolCall });
  }

  return {
    role: "assistant",
    content,
    text,
    ...(toolCalls.length === 0 ? {} : { toolCalls }),
  };
}
