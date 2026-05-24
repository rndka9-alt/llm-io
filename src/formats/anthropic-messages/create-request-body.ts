import type { JsonObject } from "../../types/json";
import type { LlmRequest } from "../../core/message";
import type { CreateAnthropicMessagesRequestBodyOptions } from "./types";
import { createAnthropicMessages } from "./utils/create-anthropic-messages";
import { createAnthropicSystem } from "./utils/create-anthropic-system";

export function createAnthropicMessagesRequestBody(
  request: LlmRequest,
  options: CreateAnthropicMessagesRequestBodyOptions,
): JsonObject {
  const system = createAnthropicSystem(request.messages);
  const requestBody: JsonObject = {
    max_tokens: request.options?.maxTokens ?? options.maxTokens,
    messages: createAnthropicMessages(request.messages),
    model: options.model,
  };

  if (system !== undefined) {
    requestBody.system = system;
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
