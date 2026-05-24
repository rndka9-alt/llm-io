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

  return omitUndefined({
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    reasoningTokens,
    totalTokens: usage.total_tokens,
  });
}
