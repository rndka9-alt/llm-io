import type { LlmToolCall } from "../../../core/message";
import type { OllamaChatRaw } from "../raw-schema";

type OllamaMessage = NonNullable<OllamaChatRaw["message"]>;

export function createOllamaToolCalls(message: OllamaMessage | undefined): LlmToolCall[] {
  const toolCalls: LlmToolCall[] = [];

  for (const toolCall of message?.tool_calls ?? []) {
    toolCalls.push({
      name: toolCall.function.name,
      arguments: toolCall.function.arguments,
    });
  }

  return toolCalls;
}
