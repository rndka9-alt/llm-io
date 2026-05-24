import { LlmIoError } from "../../../core/errors";
import { isJsonObject } from "../../../core/json";
import type { LlmToolCall } from "../../../core/message";

export function readAnthropicToolCalls(contentBlocks: readonly unknown[]): LlmToolCall[] {
  const toolCalls: LlmToolCall[] = [];

  for (const contentBlock of contentBlocks) {
    if (!isJsonObject(contentBlock) || contentBlock.type !== "tool_use") {
      continue;
    }

    if (typeof contentBlock.id !== "string") {
      throw new LlmIoError("Anthropic tool_use block must contain an id.");
    }

    if (typeof contentBlock.name !== "string") {
      throw new LlmIoError("Anthropic tool_use block must contain a name.");
    }

    if (!isJsonObject(contentBlock.input)) {
      throw new LlmIoError("Anthropic tool_use block input must be a JSON object.");
    }

    toolCalls.push({
      id: contentBlock.id,
      name: contentBlock.name,
      arguments: contentBlock.input,
    });
  }

  return toolCalls;
}
