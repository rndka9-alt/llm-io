import type { LlmUsage } from "../../../core/output";
import type { AnthropicMessagesRaw } from "../raw-schema";

export function createAnthropicUsage(usage: AnthropicMessagesRaw["usage"]): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  const totalTokens =
    usage.input_tokens === undefined || usage.output_tokens === undefined
      ? undefined
      : usage.input_tokens + usage.output_tokens;

  return {
    ...(usage.input_tokens === undefined ? {} : { inputTokens: usage.input_tokens }),
    ...(usage.output_tokens === undefined ? {} : { outputTokens: usage.output_tokens }),
    ...(totalTokens === undefined ? {} : { totalTokens }),
  };
}
