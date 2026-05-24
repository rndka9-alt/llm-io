import { LlmIoError } from "../../core/errors";
import type { LlmOutput } from "../../core/output";
import { createAssistantMessage } from "../../core/output";
import { anthropicMessagesRawSchema, type AnthropicMessagesRaw } from "./raw-schema";
import { createAnthropicUsage } from "./utils/create-anthropic-usage";
import { normalizeAnthropicFinishReason } from "./utils/normalize-anthropic-finish-reason";
import { readAnthropicReasoningText } from "./utils/read-anthropic-reasoning-text";
import { readAnthropicText } from "./utils/read-anthropic-text";
import { readAnthropicToolCalls } from "./utils/read-anthropic-tool-calls";

export function parseAnthropicMessagesResponse(
  responseJson: unknown,
): LlmOutput<AnthropicMessagesRaw> {
  const raw = anthropicMessagesRawSchema.parse(responseJson);
  const text = readAnthropicText(raw.content);
  const toolCalls = readAnthropicToolCalls(raw.content);

  if (text.length === 0 && toolCalls.length === 0) {
    throw new LlmIoError("Anthropic messages response must contain text content or tool calls.");
  }

  const reasoningText = readAnthropicReasoningText(raw.content);
  const usage = createAnthropicUsage(raw.usage);
  const finishReason = normalizeAnthropicFinishReason(raw.stop_reason);

  return {
    message: createAssistantMessage(text, toolCalls),
    ...(reasoningText.length === 0 ? {} : { reasoning: { text: reasoningText } }),
    ...(toolCalls.length === 0 ? {} : { toolCalls }),
    ...(usage === undefined ? {} : { usage }),
    ...(finishReason === undefined ? {} : { finishReason }),
    raw,
  };
}
