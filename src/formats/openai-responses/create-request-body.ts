import type { LlmMessage, LlmRequest } from "../../core/message.js";
import { getMessageText } from "../../core/message.js";

export interface CreateOpenAIResponsesRequestBodyOptions {
  extraBody?: Record<string, unknown>;
  model: string;
}

export function createOpenAIResponsesRequestBody(
  request: LlmRequest,
  options: CreateOpenAIResponsesRequestBodyOptions,
): Record<string, unknown> {
  const requestBody: Record<string, unknown> = {
    model: options.model,
    input: request.messages.map(toOpenAIResponsesInput),
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

function toOpenAIResponsesInput(message: LlmMessage): {
  content: string;
  role: LlmMessage["role"];
} {
  return {
    role: message.role,
    content: getMessageText(message),
  };
}
