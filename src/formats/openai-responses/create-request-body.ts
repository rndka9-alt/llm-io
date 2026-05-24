import type { JsonObject } from "../../types/json";
import type { LlmRequest } from "../../core/message";
import { omitUndefined } from "../../utils/object";
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
  const requestBody = omitUndefined({
    model: options.model,
    input: request.messages.flatMap(toOpenAIResponsesInput),
    max_output_tokens: request.options?.maxTokens,
    temperature: request.options?.temperature,
    top_p: request.options?.topP,
  });

  return {
    ...requestBody,
    ...options.extraBody,
  };
}
