import type { LlmFormat } from "../../../core/format";
import { LLM_FORMAT_IDS } from "../../../core/format-id";
import { throwUnsupportedFormat } from "../../utils/index";

export function resolveOllamaRequestPath(format: LlmFormat<unknown, unknown, string>): string {
  if (format.id === LLM_FORMAT_IDS.ollamaChat) {
    return "chat";
  }

  throwUnsupportedFormat("ollama", format);
}
