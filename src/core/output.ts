import type { JsonObject } from "../types/json";
import type {
  LlmRedactedThinkingPart,
  LlmThinkingPart,
  LlmToolCall,
  LlmToolCallPart,
} from "./message";

export interface LlmAssistantMessage {
  role: "assistant";
  content: readonly LlmAssistantContentPart[];
  text: string;
  toolCalls?: readonly LlmToolCall[];
}

export type LlmAssistantContentPart =
  | LlmAssistantTextPart
  | LlmAssistantToolCallPart
  | LlmAssistantThinkingPart
  | LlmAssistantRedactedThinkingPart;

export interface LlmAssistantTextPart {
  type: "text";
  text: string;
}

export type LlmAssistantToolCallPart = LlmToolCallPart;

export type LlmAssistantThinkingPart = LlmThinkingPart;

export type LlmAssistantRedactedThinkingPart = LlmRedactedThinkingPart;

export interface LlmReasoning {
  text: string;
}

export interface LlmUsage {
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  details?: JsonObject;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
}

export type LlmFinishReason =
  | "stop"
  | "length"
  | "tool-call"
  | "content-filter"
  | "pause"
  | "unknown";

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

export function createAssistantMessageFromContent(
  content: readonly LlmAssistantContentPart[],
): LlmAssistantMessage {
  const text = content
    .filter((contentPart): contentPart is LlmAssistantTextPart => contentPart.type === "text")
    .map((contentPart) => contentPart.text)
    .join("");
  const toolCalls = content.flatMap((contentPart) => {
    if (contentPart.type !== "tool-call") {
      return [];
    }

    return [
      {
        ...(contentPart.id === undefined ? {} : { id: contentPart.id }),
        name: contentPart.name,
        arguments: contentPart.arguments,
      },
    ];
  });

  return {
    role: "assistant",
    content,
    text,
    ...(toolCalls.length === 0 ? {} : { toolCalls }),
  };
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
