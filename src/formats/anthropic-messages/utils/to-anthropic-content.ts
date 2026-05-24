import { LlmIoError } from "../../../core/errors";
import type { JsonValue } from "../../../types/json";
import { isJsonObject } from "../../../utils/json";
import { omitUndefined } from "../../../utils/object";
import type {
  LlmMessage,
  LlmSearchResultPart,
  LlmToolCallPart,
  LlmToolResultPart,
} from "../../../core/message";
import type { AnthropicContentBlock } from "../types";
import type { AnthropicToolResultContentBlock } from "../types";

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

    if (contentPart.type === "image") {
      content.push({
        ...contentPart,
        type: "image",
      });
      continue;
    }

    if (contentPart.type === "document") {
      content.push({
        ...contentPart,
        type: "document",
      });
      continue;
    }

    if (contentPart.type === "search-result") {
      content.push(toAnthropicSearchResultBlock(contentPart));
      continue;
    }

    if (contentPart.type === "thinking") {
      if (message.role !== "assistant") {
        throw new LlmIoError("Anthropic thinking content parts require assistant messages.");
      }

      content.push(
        omitUndefined({
          type: "thinking",
          thinking: contentPart.thinking,
          signature: contentPart.signature,
        }),
      );
      continue;
    }

    if (contentPart.type === "redacted-thinking") {
      if (message.role !== "assistant") {
        throw new LlmIoError(
          "Anthropic redacted-thinking content parts require assistant messages.",
        );
      }

      content.push(
        omitUndefined({
          type: "redacted_thinking",
          data: contentPart.data,
        }),
      );
      continue;
    }

    if (contentPart.id === undefined) {
      throw new LlmIoError("Anthropic tool result messages require an id.");
    }

    content.push(
      omitUndefined({
        type: "tool_result",
        tool_use_id: contentPart.id,
        content: toAnthropicToolResultContent(contentPart.result),
        is_error: contentPart.isError,
      }),
    );
  }

  return content;
}

function toAnthropicSearchResultBlock(contentPart: LlmSearchResultPart): AnthropicContentBlock {
  if (contentPart.title === undefined || contentPart.title === null) {
    throw new LlmIoError("Anthropic search_result content blocks require a title.");
  }

  return {
    ...contentPart,
    type: "search_result",
    title: contentPart.title,
    content: contentPart.content.map((textPart) => ({ type: "text", text: textPart.text })),
  };
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

function toAnthropicToolResultContent(
  result: JsonValue,
): string | readonly AnthropicToolResultContentBlock[] {
  if (typeof result === "string") {
    return result;
  }

  if (Array.isArray(result) && result.every(isAnthropicToolResultContentBlock)) {
    return result;
  }

  return JSON.stringify(result);
}

function isAnthropicToolResultContentBlock(
  value: JsonValue,
): value is AnthropicToolResultContentBlock {
  if (!isJsonObject(value)) {
    return false;
  }

  return value.type === "text" || value.type === "image" || value.type === "document";
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
