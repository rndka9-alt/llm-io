import type { JsonObject, JsonValue } from "../types/json";
import { omitUndefined } from "../utils/object";

export type LlmMessageRole = "system" | "user" | "assistant" | "tool";

export type LlmContentPart =
  | LlmTextPart
  | LlmToolCallPart
  | LlmToolResultPart
  | LlmImagePart
  | LlmDocumentPart
  | LlmSearchResultPart
  | LlmThinkingPart
  | LlmRedactedThinkingPart;

export interface LlmTextPart extends JsonObject {
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

export interface LlmImagePart extends JsonObject {
  source: JsonObject;
  type: "image";
}

export interface LlmDocumentPart extends JsonObject {
  source: JsonObject;
  type: "document";
}

export interface LlmSearchResultPart extends JsonObject {
  content: readonly LlmTextPart[];
  source: string;
  title?: string | null;
  type: "search-result";
}

export interface LlmThinkingPart extends JsonObject {
  signature?: string;
  thinking: string;
  type: "thinking";
}

export interface LlmRedactedThinkingPart extends JsonObject {
  data?: string;
  type: "redacted-thinking";
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
      omitUndefined({
        type: "tool-result",
        id: toolCall.id,
        isError: options.isError,
        name: toolCall.name,
        result,
      }),
    ],
  };
}
