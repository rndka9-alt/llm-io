import type { LlmFormat } from "../../../core/format";
import { throwUnsupportedFormat } from "../../utils/index";

export function resolveNanoGPTRequestPath(format: LlmFormat<unknown, unknown>): string {
  if (format.id === "openai-chat-completions") {
    return "/chat/completions";
  }

  if (format.id === "anthropic-messages") {
    return "/messages";
  }

  throwUnsupportedFormat("nanogpt", format);
}
