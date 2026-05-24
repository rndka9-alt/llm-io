import type { JsonObject, JsonValue } from "./json";

export type LlmMessageRole = "system" | "user" | "assistant" | "tool";

export type LlmContentPart = LlmTextPart | LlmToolCallPart | LlmToolResultPart;

export interface LlmTextPart {
  type: "text";
  text: string;
}

export interface LlmToolCall {
  arguments: JsonObject;
  id?: string;
  name: string;
}

export interface LlmToolResult {
  id?: string;
  isError?: boolean;
  name: string;
  result: JsonValue;
}

export interface LlmToolCallPart extends LlmToolCall {
  type: "tool-call";
}

export interface LlmToolResultPart extends LlmToolResult {
  type: "tool-result";
}

export interface LlmMessage {
  role: LlmMessageRole;
  content: readonly LlmContentPart[];
}

export interface LlmRequestOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface LlmRequest {
  messages: readonly LlmMessage[];
  options?: LlmRequestOptions;
  signal?: AbortSignal;
}

export function getMessageText(message: LlmMessage): string {
  return message.content
    .filter((contentPart): contentPart is LlmTextPart => contentPart.type === "text")
    .map((contentPart) => contentPart.text)
    .join("");
}

export function createToolResultMessage(
  toolCall: LlmToolCall,
  result: JsonValue,
  options: { isError?: boolean } = {},
): LlmMessage {
  return {
    role: "tool",
    content: [
      {
        type: "tool-result",
        ...(toolCall.id === undefined ? {} : { id: toolCall.id }),
        ...(options.isError === undefined ? {} : { isError: options.isError }),
        name: toolCall.name,
        result,
      },
    ],
  };
}
