import type { JsonObject } from "../../core/json";
import type { LlmMessage, LlmRequest } from "../../core/message";
import { getMessageText } from "../../core/message";

export interface CreateOllamaChatRequestBodyOptions {
  extraBody?: JsonObject;
  model: string;
}

export function createOllamaChatRequestBody(
  request: LlmRequest,
  options: CreateOllamaChatRequestBodyOptions,
): JsonObject {
  return {
    model: options.model,
    stream: false,
    messages: request.messages.map(toOllamaMessage),
    ...(request.options === undefined ? {} : { options: createOllamaOptions(request) }),
    ...options.extraBody,
  };
}

function toOllamaMessage(message: LlmMessage): { content: string; role: LlmMessage["role"] } {
  return {
    role: message.role,
    content: getMessageText(message),
  };
}

function createOllamaOptions(request: LlmRequest): JsonObject {
  return {
    ...(request.options?.maxTokens === undefined ? {} : { num_predict: request.options.maxTokens }),
    ...(request.options?.temperature === undefined
      ? {}
      : { temperature: request.options.temperature }),
    ...(request.options?.topP === undefined ? {} : { top_p: request.options.topP }),
  };
}
