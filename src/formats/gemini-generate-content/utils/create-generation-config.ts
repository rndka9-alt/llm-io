import type { JsonObject } from "../../../types/json";
import type { LlmRequest } from "../../../core/message";
import { omitUndefined } from "../../../utils/object";

export function createGenerationConfig(request: LlmRequest): JsonObject | undefined {
  const generationConfig = omitUndefined({
    maxOutputTokens: request.options?.maxTokens,
    temperature: request.options?.temperature,
    topP: request.options?.topP,
  });

  if (Object.keys(generationConfig).length === 0) {
    return undefined;
  }

  return generationConfig;
}
