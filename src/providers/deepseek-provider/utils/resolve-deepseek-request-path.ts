import type { LlmFormat } from "../../../core/format";
import { throwUnsupportedFormat } from "../../utils/index";

export function resolveDeepSeekRequestPath(format: LlmFormat<unknown, unknown>): string {
  if (format.id === "openai-chat-completions") {
    return "/chat/completions";
  }

  if (format.id === "anthropic-messages") {
    return "/anthropic/messages";
  }

  throwUnsupportedFormat("deepseek", format);
}
