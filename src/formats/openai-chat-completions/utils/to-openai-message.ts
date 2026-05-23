import type { LlmMessage } from "../../../core/message";
import { getMessageText } from "../../../core/message";

export function toOpenAIMessage(message: LlmMessage): {
  content: string;
  role: LlmMessage["role"];
} {
  return {
    role: message.role,
    content: getMessageText(message),
  };
}
