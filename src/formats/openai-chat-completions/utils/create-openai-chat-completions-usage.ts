import type { LlmUsage } from "../../../core/output";
import { omitUndefined } from "../../../utils/object";
import type { OpenAIChatCompletionsRaw } from "../raw-schema";

export function createOpenAIChatCompletionsUsage(
  usage: OpenAIChatCompletionsRaw["usage"],
): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  return omitUndefined({
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    reasoningTokens: usage.completion_tokens_details?.reasoning_tokens,
    totalTokens: usage.total_tokens,
  });
}
