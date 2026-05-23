import type { LlmMessage } from "../../../core/message";
import { getMessageText } from "../../../core/message";

export function createAnthropicSystem(messages: readonly LlmMessage[]): string | undefined {
  const systemMessages: string[] = [];

  for (const message of messages) {
    if (message.role !== "system") {
      break;
    }

    const text = getMessageText(message);

    if (text.length > 0) {
      systemMessages.push(text);
    }
  }

  if (systemMessages.length === 0) {
    return undefined;
  }

  return systemMessages.join("\n\n");
}
