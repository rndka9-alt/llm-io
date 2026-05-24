import { LlmIoError } from "../../../core/errors";
import { isJsonObject } from "../../../core/json";
import type { LlmToolCall } from "../../../core/output";
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

    if (!isJsonObject(toolArguments)) {
      throw new LlmIoError("Gemini functionCall args must be a JSON object.");
    }

    toolCalls.push({
      name: part.functionCall.name,
      arguments: toolArguments,
    });
  }

  return toolCalls;
}
