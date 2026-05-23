import type { LlmMessage } from "../../../core/message";
import { getMessageText } from "../../../core/message";

export function toOpenAIResponsesInput(message: LlmMessage): {
  content: string;
  role: LlmMessage["role"];
} {
  return {
    role: message.role,
    content: getMessageText(message),
  };
}
