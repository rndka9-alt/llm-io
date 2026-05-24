import type { LlmFormat } from "../../../core/format";
import { LLM_FORMAT_IDS } from "../../../core/format-id";
import { createGeminiGenerateContentRequestPath, throwUnsupportedFormat } from "../../utils/index";

export function resolveCustomRequestPath(format: LlmFormat<unknown, unknown, string>): string {
  if (format.id === LLM_FORMAT_IDS.anthropicMessages) {
    return "/messages";
  }

  if (format.id === LLM_FORMAT_IDS.openaiChatCompletions) {
    return "/chat/completions";
  }

  if (format.id === LLM_FORMAT_IDS.openaiResponses) {
    return "/responses";
  }

  if (format.id === LLM_FORMAT_IDS.ollamaChat) {
    return "chat";
  }

  if (format.id === LLM_FORMAT_IDS.geminiGenerateContent) {
    return createGeminiGenerateContentRequestPath(format, "custom");
  }

  throwUnsupportedFormat("custom", format);
}
