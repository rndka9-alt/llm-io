import type { JsonObject } from "../../types/json";
import type { LlmRequest } from "../../core/message";
import { omitUndefined } from "../../utils/object";
import type { OpenAIChatCompletionsExtraBody } from "./types";
import { toOpenAIMessage } from "./utils/to-openai-message";

export interface CreateOpenAIChatCompletionsRequestBodyOptions {
  extraBody?: OpenAIChatCompletionsExtraBody;
  model: string;
}

export function createOpenAIChatCompletionsRequestBody(
  request: LlmRequest,
  options: CreateOpenAIChatCompletionsRequestBodyOptions,
): JsonObject {
  const requestBody = omitUndefined({
    model: options.model,
    messages: request.messages.map(toOpenAIMessage),
    max_completion_tokens: request.options?.maxTokens,
    temperature: request.options?.temperature,
    top_p: request.options?.topP,
  });

  return {
    ...requestBody,
    ...options.extraBody,
  };
}
