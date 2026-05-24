import type { JsonObject } from "../../types/json";
import type { LlmRequest } from "../../core/message";
import { omitUndefined } from "../../utils/object";
import type { CreateAnthropicMessagesRequestBodyOptions } from "./types";
import { createAnthropicMessages } from "./utils/create-anthropic-messages";
import { createAnthropicSystem } from "./utils/create-anthropic-system";

export function createAnthropicMessagesRequestBody(
  request: LlmRequest,
  options: CreateAnthropicMessagesRequestBodyOptions,
): JsonObject {
  const system = createAnthropicSystem(request.messages);
  const requestBody = omitUndefined({
    max_tokens: request.options?.maxTokens ?? options.maxTokens,
    messages: createAnthropicMessages(request.messages),
    model: options.model,
    system,
    temperature: request.options?.temperature,
    top_p: request.options?.topP,
  });

  return {
    ...requestBody,
    ...options.extraBody,
  };
}
