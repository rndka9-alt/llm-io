import type { LlmFormat } from "../../core/format.js";
import { throwUnsupportedFormat } from "./throw-unsupported-format.js";

export function resolveOpenAICompatibleRequestPath(format: LlmFormat<unknown, unknown>): string {
  if (format.id === "openai-chat-completions") {
    return "/chat/completions";
  }

  if (format.id === "openai-responses") {
    return "/responses";
  }

  throwUnsupportedFormat("openai-compatible", format);
}
