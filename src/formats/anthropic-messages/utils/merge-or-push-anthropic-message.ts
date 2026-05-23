import type { AnthropicMessage } from "../types";
import { toAnthropicTextBlock } from "./to-anthropic-text-block";

export function mergeOrPushAnthropicMessage(
  messages: AnthropicMessage[],
  role: AnthropicMessage["role"],
  text: string,
): void {
  const lastMessage = messages.at(-1);

  if (lastMessage?.role !== role) {
    messages.push({
      role,
      content: [toAnthropicTextBlock(text)],
    });
    return;
  }

  const lastContent = lastMessage.content.at(-1);

  if (lastContent === undefined) {
    lastMessage.content.push(toAnthropicTextBlock(text));
    return;
  }

  lastContent.text += `\n\n${text}`;
}
