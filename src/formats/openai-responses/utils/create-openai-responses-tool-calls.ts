import { LlmIoError } from "../../../core/errors";
import { isJsonObject } from "../../../core/json";
import type { LlmToolCall } from "../../../core/message";

export function createOpenAIResponsesToolCalls(outputItems: readonly unknown[]): LlmToolCall[] {
  const toolCalls: LlmToolCall[] = [];

  for (const outputItem of outputItems) {
    if (!isJsonObject(outputItem) || outputItem.type !== "function_call") {
      continue;
    }

    if (typeof outputItem.name !== "string") {
      throw new LlmIoError("OpenAI responses function_call items require a name.");
    }

    if (typeof outputItem.arguments !== "string") {
      throw new LlmIoError("OpenAI responses function_call arguments must be a JSON string.");
    }

    if (typeof outputItem.call_id !== "string") {
      throw new LlmIoError("OpenAI responses function_call items require a call_id.");
    }

    toolCalls.push({
      id: outputItem.call_id,
      name: outputItem.name,
      arguments: parseOpenAIResponsesToolCallArguments(outputItem.arguments),
    });
  }

  return toolCalls;
}

function parseOpenAIResponsesToolCallArguments(argumentsText: string): LlmToolCall["arguments"] {
  let parsedArguments: unknown;

  try {
    parsedArguments = JSON.parse(argumentsText);
  } catch (cause) {
    throw new LlmIoError("OpenAI responses function_call arguments must be valid JSON.", cause);
  }

  if (!isJsonObject(parsedArguments)) {
    throw new LlmIoError("OpenAI responses function_call arguments must be a JSON object.");
  }

  return parsedArguments;
}
