import type { LlmMessage } from "../../../core/message";
import { getMessageText } from "../../../core/message";
import type { AnthropicMessage } from "../types";
import {
  mergeOrPushAnthropicContent,
  mergeOrPushAnthropicMessage,
} from "./merge-or-push-anthropic-message";
import { normalizeAnthropicMessageRole } from "./normalize-anthropic-message-role";
import { toAnthropicContent } from "./to-anthropic-content";

export function createAnthropicMessages(messages: readonly LlmMessage[]): AnthropicMessage[] {
  const anthropicMessages: AnthropicMessage[] = [];
  let acceptsSystemPrompt = true;

  for (const message of messages) {
    if (message.role !== "system") {
      acceptsSystemPrompt = false;
    }

    if (message.role === "system" && acceptsSystemPrompt) {
      continue;
    }

    if (message.role === "system") {
      const text = `System: ${getMessageText(message)}`;

      if (text.length === 0) {
        continue;
      }

      mergeOrPushAnthropicMessage(
        anthropicMessages,
        normalizeAnthropicMessageRole(message.role),
        text,
      );
      continue;
    }

    const content = toAnthropicContent(message);

    if (content.length === 0) {
      continue;
    }

    mergeOrPushAnthropicContent(
      anthropicMessages,
      normalizeAnthropicMessageRole(message.role),
      content,
    );
  }

  if (anthropicMessages.length === 0 || anthropicMessages[0]?.role !== "user") {
    anthropicMessages.unshift({
      role: "user",
      content: [{ type: "text", text: "Start" }],
    });
  }

  return anthropicMessages;
}
