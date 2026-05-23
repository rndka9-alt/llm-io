import type { LlmFormat } from "../../../core/format";
import { throwUnsupportedFormat } from "../../utils/index";

export function resolveOpenRouterRequestPath(format: LlmFormat<unknown, unknown>): string {
  if (format.id === "openai-chat-completions") {
    return "/chat/completions";
  }

  throwUnsupportedFormat("openrouter", format);
}
