import { LlmIoError } from "../../../core/errors";
import { isJsonObject } from "../../../core/json";
import type { LlmToolCall } from "../../../core/output";
import type { OpenAIChatCompletionsRaw } from "../raw-schema";

type OpenAIChatCompletionsMessage = OpenAIChatCompletionsRaw["choices"][number]["message"];

export function createOpenAIChatCompletionsToolCalls(
  message: OpenAIChatCompletionsMessage,
): LlmToolCall[] {
  const toolCalls: LlmToolCall[] = [];

  for (const toolCall of message.tool_calls ?? []) {
    const toolArguments = parseOpenAIToolCallArguments(toolCall.function.arguments);

    toolCalls.push({
      ...(toolCall.id === undefined ? {} : { id: toolCall.id }),
      name: toolCall.function.name,
      arguments: toolArguments,
    });
  }

  return toolCalls;
}

function parseOpenAIToolCallArguments(argumentsText: string): LlmToolCall["arguments"] {
  let parsedArguments: unknown;

  try {
    parsedArguments = JSON.parse(argumentsText);
  } catch (cause) {
    throw new LlmIoError("OpenAI tool call arguments must be valid JSON.", cause);
  }

  if (!isJsonObject(parsedArguments)) {
    throw new LlmIoError("OpenAI tool call arguments must be a JSON object.");
  }

  return parsedArguments;
}
