import type { JsonObject } from "../../types/json";
import type { LlmRequest } from "../../core/message";
import type {
  CreateGeminiGenerateContentRequestBodyOptions,
  GeminiGenerationConfig,
} from "./types";
import { createGenerationConfig } from "./utils/create-generation-config";
import { createSystemInstruction } from "./utils/create-system-instruction";
import { isGeminiContentMessage } from "./utils/is-gemini-content-message";
import { toGeminiContent } from "./utils/to-gemini-content";

export function createGeminiGenerateContentRequestBody(
  request: LlmRequest,
  options: CreateGeminiGenerateContentRequestBodyOptions = {},
): JsonObject {
  const systemInstruction = createSystemInstruction(request.messages);
  const generationConfig = mergeGenerationConfig(
    createGenerationConfig(request),
    options.extraBody?.generationConfig,
  );
  const requestBody: JsonObject = {
    contents: request.messages.filter(isGeminiContentMessage).map(toGeminiContent),
  };

  if (systemInstruction !== undefined) {
    requestBody.systemInstruction = systemInstruction;
  }

  if (generationConfig !== undefined) {
    requestBody.generationConfig = generationConfig;
  }

  return {
    ...requestBody,
    ...options.extraBody,
    ...(generationConfig === undefined ? {} : { generationConfig }),
  };
}

function mergeGenerationConfig(
  generationConfig: JsonObject | undefined,
  extraGenerationConfig: GeminiGenerationConfig | undefined,
): JsonObject | undefined {
  if (generationConfig === undefined) {
    return extraGenerationConfig;
  }

  if (extraGenerationConfig === undefined) {
    return generationConfig;
  }

  return {
    ...generationConfig,
    ...extraGenerationConfig,
  };
}
