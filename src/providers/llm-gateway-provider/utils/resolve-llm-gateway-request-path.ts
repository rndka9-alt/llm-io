import type { LlmFormat } from "../../../core/format";
import { LLM_FORMAT_IDS } from "../../../core/format-id";
import { throwUnsupportedFormat } from "../../utils/index";

export function resolveLLMGatewayRequestPath(format: LlmFormat<unknown, unknown, string>): string {
  if (format.id === LLM_FORMAT_IDS.openaiChatCompletions) {
    return "/chat/completions";
  }

  if (format.id === LLM_FORMAT_IDS.anthropicMessages) {
    return "/messages";
  }

  throwUnsupportedFormat("llm-gateway", format);
}
