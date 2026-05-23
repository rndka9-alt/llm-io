import type { LlmMessage } from "../../../core/message";

export function isGeminiContentMessage(
  message: LlmMessage,
): message is LlmMessage & { role: "assistant" | "user" } {
  return message.role === "assistant" || message.role === "user";
}
