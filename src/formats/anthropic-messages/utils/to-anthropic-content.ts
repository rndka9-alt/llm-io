import { LlmIoError } from "../../../core/errors";
import type { JsonValue } from "../../../core/json";
import type { LlmMessage, LlmToolCallPart, LlmToolResultPart } from "../../../core/message";
import type { AnthropicContentBlock } from "../types";

export function toAnthropicContent(message: LlmMessage): AnthropicContentBlock[] {
  validateAnthropicToolContent(message);

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

function validateAnthropicToolContent(message: LlmMessage): void {
  const toolCalls = message.content.filter(isToolCallPart);
  const toolResults = message.content.filter(isToolResultPart);

  if (toolCalls.length > 0 && toolResults.length > 0) {
    throw new LlmIoError("Anthropic messages cannot mix tool-call and tool-result content parts.");
  }

  if (toolCalls.length > 0 && message.role !== "assistant") {
    throw new LlmIoError("Anthropic tool-call content parts require assistant messages.");
  }

  if (toolResults.length > 0 && message.role !== "tool") {
    throw new LlmIoError("Anthropic tool-result content parts require tool messages.");
  }

  if (message.role === "tool" && toolResults.length === 0) {
    throw new LlmIoError("Anthropic tool messages require a tool-result content part.");
  }

  if (toolResults.length > 0 && message.content.length !== toolResults.length) {
    throw new LlmIoError("Anthropic tool messages support only tool-result content parts.");
  }
}

function stringifyToolResult(result: JsonValue): string {
  if (typeof result === "string") {
    return result;
  }

  return JSON.stringify(result);
}

function isToolCallPart(
  contentPart: LlmMessage["content"][number],
): contentPart is LlmToolCallPart {
  return contentPart.type === "tool-call";
}

function isToolResultPart(
  contentPart: LlmMessage["content"][number],
): contentPart is LlmToolResultPart {
  return contentPart.type === "tool-result";
}
