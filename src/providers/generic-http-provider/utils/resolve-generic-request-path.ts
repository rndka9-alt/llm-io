import type { LlmFormat } from "../../../core/format";
import { createGeminiGenerateContentRequestPath, throwUnsupportedFormat } from "../../utils/index";

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
