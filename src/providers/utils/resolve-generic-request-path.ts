import type { LlmFormat } from "../../core/format.js";
import { createGeminiGenerateContentRequestPath } from "./create-gemini-generate-content-request-path.js";
import { throwUnsupportedFormat } from "./throw-unsupported-format.js";

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
