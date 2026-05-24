import type { AnthropicContentBlock, AnthropicMessage } from "../types";
import { toAnthropicTextBlock } from "./to-anthropic-text-block";

export function mergeOrPushAnthropicMessage(
  messages: AnthropicMessage[],
  role: AnthropicMessage["role"],
  text: string,
): void {
  mergeOrPushAnthropicContent(messages, role, [toAnthropicTextBlock(text)]);
}

export function mergeOrPushAnthropicContent(
  messages: AnthropicMessage[],
  role: AnthropicMessage["role"],
  content: AnthropicContentBlock[],
): void {
  const lastMessage = messages.at(-1);

  if (lastMessage?.role !== role) {
    messages.push({
      role,
      content,
    });
    return;
  }

  const lastContent = lastMessage.content.at(-1);
  const firstContent = content[0];

  if (lastContent?.type === "text" && firstContent?.type === "text") {
    lastContent.text += `\n\n${firstContent.text}`;
    lastMessage.content.push(...content.slice(1));
    return;
  }

  lastMessage.content.push(...content);
}
