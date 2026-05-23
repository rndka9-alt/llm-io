import type { JsonObject } from "../../core/json";
import type { LlmRequest } from "../../core/message";
import { toOpenAIMessage } from "./utils/to-openai-message";

export interface CreateOpenAIChatCompletionsRequestBodyOptions {
  extraBody?: JsonObject;
  model: string;
}

export function createOpenAIChatCompletionsRequestBody(
  request: LlmRequest,
  options: CreateOpenAIChatCompletionsRequestBodyOptions,
): JsonObject {
  const requestBody: JsonObject = {
    model: options.model,
    messages: request.messages.map(toOpenAIMessage),
  };

  if (request.options?.maxTokens !== undefined) {
    requestBody.max_tokens = request.options.maxTokens;
  }

  if (request.options?.temperature !== undefined) {
    requestBody.temperature = request.options.temperature;
  }

  if (request.options?.topP !== undefined) {
    requestBody.top_p = request.options.topP;
  }

  return {
    ...requestBody,
    ...options.extraBody,
  };
}
