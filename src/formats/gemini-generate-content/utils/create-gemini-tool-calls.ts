import type { LlmToolCall } from "../../../core/message";
import type { GeminiGenerateContentRaw } from "../raw-schema";

type GeminiPart = NonNullable<
  NonNullable<NonNullable<GeminiGenerateContentRaw["candidates"]>[number]["content"]>["parts"]
>[number];

export function createGeminiToolCalls(parts: readonly GeminiPart[]): LlmToolCall[] {
  const toolCalls: LlmToolCall[] = [];

  for (const part of parts) {
    if (part.functionCall === undefined) {
      continue;
    }

    const functionCallArguments = part.functionCall.args;
    const toolArguments = functionCallArguments === undefined ? {} : functionCallArguments;

    toolCalls.push({
      name: part.functionCall.name,
      arguments: toolArguments,
    });
  }

  return toolCalls;
}
