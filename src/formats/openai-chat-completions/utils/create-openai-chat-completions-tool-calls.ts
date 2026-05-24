import { LlmIoError } from "../../../core/errors";
import { jsonObjectSchema } from "../../../utils/json";
import type { LlmToolCall } from "../../../core/message";
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

  const toolArgumentsResult = jsonObjectSchema.safeParse(parsedArguments);

  if (!toolArgumentsResult.success) {
    throw new LlmIoError(
      "OpenAI tool call arguments must be a JSON object.",
      toolArgumentsResult.error,
    );
  }

  return toolArgumentsResult.data;
}
