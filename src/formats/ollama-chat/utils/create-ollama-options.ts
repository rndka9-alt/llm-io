import type { JsonObject } from "../../../core/json";
import type { LlmRequest } from "../../../core/message";

export function createOllamaOptions(request: LlmRequest): JsonObject {
  return {
    ...(request.options?.maxTokens === undefined ? {} : { num_predict: request.options.maxTokens }),
    ...(request.options?.temperature === undefined
      ? {}
      : { temperature: request.options.temperature }),
    ...(request.options?.topP === undefined ? {} : { top_p: request.options.topP }),
  };
}
