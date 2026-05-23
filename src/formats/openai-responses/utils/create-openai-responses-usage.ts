import type { LlmUsage } from "../../../core/output";
import type { OpenAIResponsesRaw } from "../raw-schema";

export function createOpenAIResponsesUsage(
  usage: OpenAIResponsesRaw["usage"],
): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  const reasoningTokens = usage.output_tokens_details?.reasoning_tokens;

  return {
    ...(usage.input_tokens === undefined ? {} : { inputTokens: usage.input_tokens }),
    ...(usage.output_tokens === undefined ? {} : { outputTokens: usage.output_tokens }),
    ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
    ...(usage.total_tokens === undefined ? {} : { totalTokens: usage.total_tokens }),
  };
}
