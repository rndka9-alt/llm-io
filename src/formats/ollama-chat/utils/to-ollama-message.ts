import type { LlmMessage } from "../../../core/message";
import { getMessageText } from "../../../core/message";

export function toOllamaMessage(message: LlmMessage): {
  content: string;
  role: LlmMessage["role"];
} {
  return {
    role: message.role,
    content: getMessageText(message),
  };
}
