import { LlmIoError } from "../core/errors.js";
import type { LlmFormat } from "../core/format.js";

export interface BearerHeadersOptions {
  apiKey?: string;
  headers?: Record<string, string>;
}

export function createBearerHeaders(options: BearerHeadersOptions): Record<string, string> {
  return {
    "content-type": "application/json",
    ...options.headers,
    ...(options.apiKey === undefined ? {} : { authorization: `Bearer ${options.apiKey}` }),
  };
}

export function joinUrlPath(baseUrl: string, relativePath: string | undefined): string {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  if (relativePath === undefined || relativePath.length === 0) {
    return normalizedBaseUrl;
  }

  return `${normalizedBaseUrl}/${relativePath.replace(/^\//, "")}`;
}

export function resolveGenericRequestPath(format: LlmFormat<unknown, unknown>): string {
  if (format.id === "openai-chat-completions") {
    return "/chat/completions";
  }

  if (format.id === "openai-responses") {
    return "/responses";
  }

  if (format.id === "ollama-chat") {
    return "chat";
  }

  if (format.id === "gemini-generate-content") {
    return createGeminiGenerateContentRequestPath(format, "generic-http");
  }

  throwUnsupportedFormat("generic-http", format);
}

export function resolveOpenAICompatibleRequestPath(format: LlmFormat<unknown, unknown>): string {
  if (format.id === "openai-chat-completions") {
    return "/chat/completions";
  }

  if (format.id === "openai-responses") {
    return "/responses";
  }

  throwUnsupportedFormat("openai-compatible", format);
}

export function resolveOllamaRequestPath(format: LlmFormat<unknown, unknown>): string {
  if (format.id === "ollama-chat") {
    return "chat";
  }

  throwUnsupportedFormat("ollama", format);
}

export function createGeminiGenerateContentRequestPath(
  format: LlmFormat<unknown, unknown>,
  providerId: string,
): string {
  return `models/${encodeURIComponent(readGeminiGenerateContentModel(format, providerId))}:generateContent`;
}

export function readGeminiGenerateContentModel(
  format: LlmFormat<unknown, unknown>,
  providerId: string,
): string {
  if (format.id !== "gemini-generate-content") {
    throwUnsupportedFormat(providerId, format);
  }

  return readRequiredFormatModel(format, providerId);
}

export function readRequiredFormatModel(
  format: LlmFormat<unknown, unknown>,
  providerId: string,
): string {
  if (format.model === undefined || format.model.length === 0) {
    throw new LlmIoError(`${providerId} provider requires ${format.id} format to expose a model.`);
  }

  return format.model;
}

function throwUnsupportedFormat(providerId: string, format: LlmFormat<unknown, unknown>): never {
  throw new LlmIoError(`${providerId} provider does not support ${format.id} format.`);
}
