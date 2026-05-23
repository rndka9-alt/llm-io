export type LlmMessageRole = "system" | "user" | "assistant";

export type LlmContentPart = LlmTextPart;

export interface LlmTextPart {
  type: "text";
  text: string;
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
  return message.content.map((contentPart) => contentPart.text).join("");
}
