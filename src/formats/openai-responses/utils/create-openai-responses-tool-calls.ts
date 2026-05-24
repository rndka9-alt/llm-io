import { LlmIoError } from "../../../core/errors";
import { jsonObjectSchema } from "../../../utils/json";
import type { LlmToolCall } from "../../../core/message";
import { openAIResponsesFunctionCallOutputItemSchema } from "../raw-schema";

export function createOpenAIResponsesToolCalls(outputItems: readonly unknown[]): LlmToolCall[] {
  const toolCalls: LlmToolCall[] = [];

  for (const outputItem of outputItems) {
    const outputItemResult = openAIResponsesFunctionCallOutputItemSchema.safeParse(outputItem);

    if (!outputItemResult.success) {
      continue;
    }

    const functionCallOutputItem = outputItemResult.data;

    toolCalls.push({
      id: functionCallOutputItem.call_id,
      name: functionCallOutputItem.name,
      arguments: parseOpenAIResponsesToolCallArguments(functionCallOutputItem.arguments),
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

  const toolArgumentsResult = jsonObjectSchema.safeParse(parsedArguments);

  if (!toolArgumentsResult.success) {
    throw new LlmIoError(
      "OpenAI responses function_call arguments must be a JSON object.",
      toolArgumentsResult.error,
    );
  }

  return toolArgumentsResult.data;
}
