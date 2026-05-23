import type { LlmMessage } from "../../../core/message";
import { getMessageText } from "../../../core/message";

export function toGeminiContent(message: LlmMessage): {
  parts: { text: string }[];
  role: "model" | "user";
} {
  return {
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: getMessageText(message) }],
  };
}
