import type { LlmMessage } from "../../../core/message";
import { getMessageText } from "../../../core/message";

export function createSystemInstruction(
  messages: readonly LlmMessage[],
): { parts: { text: string }[] } | undefined {
  const text = messages
    .filter((message) => message.role === "system")
    .map(getMessageText)
    .join("\n\n");

  if (text.length === 0) {
    return undefined;
  }

  return {
    parts: [{ text }],
  };
}
