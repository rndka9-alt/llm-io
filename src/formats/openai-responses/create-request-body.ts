import type { JsonObject } from "../../core/json";
import type { LlmRequest } from "../../core/message";
import type { OpenAIResponsesExtraBody } from "./types";
import { toOpenAIResponsesInput } from "./utils/to-openai-responses-input";

export interface CreateOpenAIResponsesRequestBodyOptions {
  extraBody?: OpenAIResponsesExtraBody;
  model: string;
}

export function createOpenAIResponsesRequestBody(
  request: LlmRequest,
  options: CreateOpenAIResponsesRequestBodyOptions,
): JsonObject {
  const requestBody: JsonObject = {
    model: options.model,
    input: request.messages.flatMap(toOpenAIResponsesInput),
  };

  if (request.options?.maxTokens !== undefined) {
    requestBody.max_output_tokens = request.options.maxTokens;
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
