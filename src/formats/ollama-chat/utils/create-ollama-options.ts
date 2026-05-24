import type { JsonObject } from "../../../types/json";
import type { LlmRequest } from "../../../core/message";
import { omitUndefined } from "../../../utils/object";

export function createOllamaOptions(request: LlmRequest): JsonObject | undefined {
  const options = omitUndefined({
    num_predict: request.options?.maxTokens,
    temperature: request.options?.temperature,
    top_p: request.options?.topP,
  });

  if (Object.keys(options).length === 0) {
    return undefined;
  }

  return options;
}
