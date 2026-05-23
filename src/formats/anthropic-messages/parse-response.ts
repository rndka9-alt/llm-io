import { LlmIoError } from "../../core/errors";
import type { LlmOutput } from "../../core/output";
import { createTextAssistantMessage } from "../../core/output";
import { anthropicMessagesRawSchema, type AnthropicMessagesRaw } from "./raw-schema";
import { createAnthropicUsage } from "./utils/create-anthropic-usage";
import { normalizeAnthropicFinishReason } from "./utils/normalize-anthropic-finish-reason";
import { readAnthropicReasoningText } from "./utils/read-anthropic-reasoning-text";
import { readAnthropicText } from "./utils/read-anthropic-text";

export function parseAnthropicMessagesResponse(
  responseJson: unknown,
): LlmOutput<AnthropicMessagesRaw> {
  const raw = anthropicMessagesRawSchema.parse(responseJson);
  const text = readAnthropicText(raw.content);

  if (text.length === 0) {
    throw new LlmIoError("Anthropic messages response must contain text content.");
  }

  const reasoningText = readAnthropicReasoningText(raw.content);
  const usage = createAnthropicUsage(raw.usage);
  const finishReason = normalizeAnthropicFinishReason(raw.stop_reason);

  return {
    message: createTextAssistantMessage(text),
    ...(reasoningText.length === 0 ? {} : { reasoning: { text: reasoningText } }),
    ...(usage === undefined ? {} : { usage }),
    ...(finishReason === undefined ? {} : { finishReason }),
    raw,
  };
}
