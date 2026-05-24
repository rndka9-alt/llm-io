import { LlmIoError } from "../../../core/errors";
import type { JsonValue } from "../../../core/json";
import type { LlmMessage } from "../../../core/message";
import type { AnthropicContentBlock } from "../types";

export function toAnthropicContent(message: LlmMessage): AnthropicContentBlock[] {
  const content: AnthropicContentBlock[] = [];

  for (const contentPart of message.content) {
    if (contentPart.type === "text") {
      content.push({ type: "text", text: contentPart.text });
      continue;
    }

    if (contentPart.type === "tool-call") {
      if (contentPart.id === undefined) {
        throw new LlmIoError("Anthropic assistant tool calls require an id.");
      }

      content.push({
        type: "tool_use",
        id: contentPart.id,
        name: contentPart.name,
        input: contentPart.arguments,
      });
      continue;
    }

    if (contentPart.id === undefined) {
      throw new LlmIoError("Anthropic tool result messages require an id.");
    }

    content.push({
      type: "tool_result",
      tool_use_id: contentPart.id,
      content: stringifyToolResult(contentPart.result),
      ...(contentPart.isError === undefined ? {} : { is_error: contentPart.isError }),
    });
  }

  return content;
}

function stringifyToolResult(result: JsonValue): string {
  if (typeof result === "string") {
    return result;
  }

  return JSON.stringify(result);
}
