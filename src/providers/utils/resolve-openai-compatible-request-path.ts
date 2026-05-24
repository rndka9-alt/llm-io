import type { LlmFormat } from "../../core/format";
import { LLM_FORMAT_IDS } from "../../core/format-id";
import { throwUnsupportedFormat } from "./throw-unsupported-format";

export function resolveOpenAICompatibleRequestPath(
  format: LlmFormat<unknown, unknown, string>,
): string {
  if (format.id === LLM_FORMAT_IDS.openaiChatCompletions) {
    return "/chat/completions";
  }

  if (format.id === LLM_FORMAT_IDS.openaiResponses) {
    return "/responses";
  }

  throwUnsupportedFormat("openai-compatible", format);
}
