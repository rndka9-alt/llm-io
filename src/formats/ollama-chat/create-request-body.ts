import type { JsonObject } from "../../types/json";
import type { LlmRequest } from "../../core/message";
import type { OllamaChatExtraBody } from "./types";
import { createOllamaOptions } from "./utils/create-ollama-options";
import { toOllamaMessage } from "./utils/to-ollama-message";

export interface CreateOllamaChatRequestBodyOptions {
  extraBody?: OllamaChatExtraBody;
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
