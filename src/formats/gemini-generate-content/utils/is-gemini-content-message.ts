import type { LlmMessage } from "../../../core/message";

export function isGeminiContentMessage(
  message: LlmMessage,
): message is LlmMessage & { role: "assistant" | "tool" | "user" } {
  return message.role === "assistant" || message.role === "tool" || message.role === "user";
}
