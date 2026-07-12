import type { LlmUsage } from "../../../core/output";
import { omitUndefined } from "../../../utils/object";
import type { OpenAIResponsesRaw } from "../raw-schema";

export function createOpenAIResponsesUsage(
  usage: OpenAIResponsesRaw["usage"],
): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  const reasoningTokens = usage.output_tokens_details?.reasoning_tokens;
  const cacheCreationInputTokens = usage.input_tokens_details?.cache_write_tokens;
  const cacheReadInputTokens = usage.input_tokens_details?.cached_tokens;

  return omitUndefined({
    cacheCreationInputTokens,
    cacheReadInputTokens,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    reasoningTokens,
    totalTokens: usage.total_tokens,
  });
}
