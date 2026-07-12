import type { LlmUsage } from "../../../core/output";
import { omitUndefined, undefinedIfEmptyObject } from "../../../utils/object";
import type { OpenAIChatCompletionsRaw } from "../raw-schema";

export function createOpenAIChatCompletionsUsage(
  usage: OpenAIChatCompletionsRaw["usage"] | null,
): LlmUsage | undefined {
  if (usage === undefined || usage === null) {
    return undefined;
  }

  const details = undefinedIfEmptyObject(
    omitUndefined({
      cost: usage.cost,
      costDetails: usage.cost_details,
      info: usage.info,
    }),
  );

  return omitUndefined({
    cacheCreationInputTokens: usage.prompt_tokens_details?.cache_write_tokens,
    cacheReadInputTokens: usage.prompt_tokens_details?.cached_tokens,
    details,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    reasoningTokens: usage.completion_tokens_details?.reasoning_tokens,
    totalTokens: usage.total_tokens,
  });
}
