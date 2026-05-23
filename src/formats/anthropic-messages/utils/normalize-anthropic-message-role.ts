import type { LlmMessageRole } from "../../../core/message";

export function normalizeAnthropicMessageRole(role: LlmMessageRole): "assistant" | "user" {
  if (role === "assistant") {
    return "assistant";
  }

  return "user";
}
