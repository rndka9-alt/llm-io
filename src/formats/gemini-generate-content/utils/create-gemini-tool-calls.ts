import type { LlmToolCall } from "../../../core/message";
import { omitUndefined } from "../../../utils/object";
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

    toolCalls.push(
      omitUndefined({
        id: part.functionCall.id,
        name: part.functionCall.name,
        arguments: part.functionCall.args ?? {},
      }),
    );
  }

  return toolCalls;
}
