import type { JsonObject } from "../../core/json";
import type { LlmRequest } from "../../core/message";
import { createOllamaOptions } from "./utils/create-ollama-options";
import { toOllamaMessage } from "./utils/to-ollama-message";

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
