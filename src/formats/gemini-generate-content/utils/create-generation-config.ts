import type { JsonObject } from "../../../core/json";
import type { LlmRequest } from "../../../core/message";

export function createGenerationConfig(request: LlmRequest): JsonObject | undefined {
  const generationConfig: JsonObject = {};

  if (request.options?.maxTokens !== undefined) {
    generationConfig.maxOutputTokens = request.options.maxTokens;
  }

  if (request.options?.temperature !== undefined) {
    generationConfig.temperature = request.options.temperature;
  }

  if (request.options?.topP !== undefined) {
    generationConfig.topP = request.options.topP;
  }

  if (Object.keys(generationConfig).length === 0) {
    return undefined;
  }

  return generationConfig;
}
