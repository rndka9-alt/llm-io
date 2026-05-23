import type { JsonObject } from "../../core/json";
import type { LlmRequest } from "../../core/message";
import { createGenerationConfig } from "./utils/create-generation-config";
import { createSystemInstruction } from "./utils/create-system-instruction";
import { isGeminiContentMessage } from "./utils/is-gemini-content-message";
import { toGeminiContent } from "./utils/to-gemini-content";

export interface CreateGeminiGenerateContentRequestBodyOptions {
  extraBody?: JsonObject;
}

export function createGeminiGenerateContentRequestBody(
  request: LlmRequest,
  options: CreateGeminiGenerateContentRequestBodyOptions = {},
): JsonObject {
  const systemInstruction = createSystemInstruction(request.messages);
  const requestBody: JsonObject = {
    contents: request.messages.filter(isGeminiContentMessage).map(toGeminiContent),
  };

  const generationConfig = createGenerationConfig(request);

  if (systemInstruction !== undefined) {
    requestBody.systemInstruction = systemInstruction;
  }

  if (generationConfig !== undefined) {
    requestBody.generationConfig = generationConfig;
  }

  return {
    ...requestBody,
    ...options.extraBody,
  };
}
