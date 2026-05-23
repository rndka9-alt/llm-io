import type { LlmFormat } from "../../core/format";
import { throwUnsupportedFormat } from "./throw-unsupported-format";

export function resolveOllamaRequestPath(format: LlmFormat<unknown, unknown>): string {
  if (format.id === "ollama-chat") {
    return "chat";
  }

  throwUnsupportedFormat("ollama", format);
}
