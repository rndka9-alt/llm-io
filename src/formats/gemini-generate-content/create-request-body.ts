import type { LlmMessage, LlmRequest } from "../../core/message";
import { getMessageText } from "../../core/message";

export interface CreateGeminiGenerateContentRequestBodyOptions {
  extraBody?: Record<string, unknown>;
}

export function createGeminiGenerateContentRequestBody(
  request: LlmRequest,
  options: CreateGeminiGenerateContentRequestBodyOptions = {},
): Record<string, unknown> {
  const systemInstruction = createSystemInstruction(request.messages);
  const requestBody: Record<string, unknown> = {
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

function createSystemInstruction(
  messages: readonly LlmMessage[],
): { parts: { text: string }[] } | undefined {
  const text = messages
    .filter((message) => message.role === "system")
    .map(getMessageText)
    .join("\n\n");

  if (text.length === 0) {
    return undefined;
  }

  return {
    parts: [{ text }],
  };
}

function toGeminiContent(message: LlmMessage): {
  parts: { text: string }[];
  role: "model" | "user";
} {
  return {
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: getMessageText(message) }],
  };
}

function isGeminiContentMessage(
  message: LlmMessage,
): message is LlmMessage & { role: "assistant" | "user" } {
  return message.role === "assistant" || message.role === "user";
}

function createGenerationConfig(request: LlmRequest): Record<string, unknown> | undefined {
  const generationConfig: Record<string, unknown> = {};

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
