import type { LlmMessage, LlmRequest } from "../../core/message.js";
import { getMessageText } from "../../core/message.js";

export interface CreateOllamaChatRequestBodyOptions {
  extraBody?: Record<string, unknown>;
  model: string;
}

export function createOllamaChatRequestBody(
  request: LlmRequest,
  options: CreateOllamaChatRequestBodyOptions,
): Record<string, unknown> {
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

function createOllamaOptions(request: LlmRequest): Record<string, unknown> {
  return {
    ...(request.options?.maxTokens === undefined ? {} : { num_predict: request.options.maxTokens }),
    ...(request.options?.temperature === undefined
      ? {}
      : { temperature: request.options.temperature }),
    ...(request.options?.topP === undefined ? {} : { top_p: request.options.topP }),
  };
}
