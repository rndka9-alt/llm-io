import { LlmIoError } from "../../core/errors";
import type { LlmOutput } from "../../core/output";
import {
  createAssistantMessageFromContent,
  createReasoning,
  type LlmAssistantContentPart,
} from "../../core/output";
import { undefinedIfEmptyArray } from "../../utils/array";
import { omitUndefined } from "../../utils/object";
import { anthropicMessagesRawSchema, type AnthropicMessagesRaw } from "./raw-schema";
import { createAnthropicAssistantContent } from "./utils/create-anthropic-assistant-content";
import { createAnthropicUsage } from "./utils/create-anthropic-usage";
import { normalizeAnthropicFinishReason } from "./utils/normalize-anthropic-finish-reason";

export function parseAnthropicMessagesResponse(
  responseJson: unknown,
): LlmOutput<AnthropicMessagesRaw> {
  const raw = anthropicMessagesRawSchema.parse(responseJson);
  const assistantContent = createAnthropicAssistantContent(raw.content);
  const message = createAssistantMessageFromContent(assistantContent);
  const toolCalls = message.toolCalls ?? [];

  if (message.text.length === 0 && toolCalls.length === 0) {
    throw new LlmIoError("Anthropic messages response must contain text content or tool calls.");
  }

  const reasoningText = createAnthropicReasoningText(assistantContent);
  const usage = createAnthropicUsage(raw.usage);
  const finishReason = normalizeAnthropicFinishReason(raw.stop_reason);

  return omitUndefined({
    message,
    reasoning: createReasoning(reasoningText),
    toolCalls: undefinedIfEmptyArray(toolCalls),
    usage,
    finishReason,
    raw,
  });
}

function createAnthropicReasoningText(content: readonly LlmAssistantContentPart[]): string {
  return content
    .flatMap((contentPart) => {
      if (contentPart.type === "thinking") {
        return [contentPart.thinking];
      }

      if (contentPart.type === "redacted-thinking") {
        return ["{{redacted_thinking}}"];
      }

      return [];
    })
    .join("\n");
}
