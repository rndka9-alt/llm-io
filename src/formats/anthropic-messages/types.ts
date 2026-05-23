import type { JsonObject } from "../../core/json";

export interface AnthropicTextBlock extends JsonObject {
  text: string;
  type: "text";
}

export interface AnthropicMessage extends JsonObject {
  content: AnthropicTextBlock[];
  role: "assistant" | "user";
}

export interface CreateAnthropicMessagesRequestBodyOptions {
  extraBody?: JsonObject;
  maxTokens: number;
  model: string;
}
