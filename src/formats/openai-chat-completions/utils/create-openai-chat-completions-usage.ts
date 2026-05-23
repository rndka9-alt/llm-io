import type { LlmUsage } from "../../../core/output";
import type { OpenAIChatCompletionsRaw } from "../raw-schema";

export function createOpenAIChatCompletionsUsage(
  usage: OpenAIChatCompletionsRaw["usage"],
): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  return {
    ...(usage.prompt_tokens === undefined ? {} : { inputTokens: usage.prompt_tokens }),
    ...(usage.completion_tokens === undefined ? {} : { outputTokens: usage.completion_tokens }),
    ...(usage.total_tokens === undefined ? {} : { totalTokens: usage.total_tokens }),
  };
}
