import type { LlmFormat } from "../../../core/format";
import { throwUnsupportedFormat } from "../../utils/index";

export function resolveAnthropicRequestPath(format: LlmFormat<unknown, unknown>): string {
  if (format.id === "anthropic-messages") {
    return "/messages";
  }

  throwUnsupportedFormat("anthropic", format);
}
