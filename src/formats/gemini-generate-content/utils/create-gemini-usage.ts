import type { LlmUsage } from "../../../core/output";
import type { GeminiGenerateContentRaw } from "../raw-schema";

export function createGeminiUsage(
  usage: GeminiGenerateContentRaw["usageMetadata"],
): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  return {
    ...(usage.promptTokenCount === undefined ? {} : { inputTokens: usage.promptTokenCount }),
    ...(usage.candidatesTokenCount === undefined
      ? {}
      : { outputTokens: usage.candidatesTokenCount }),
    ...(usage.thoughtsTokenCount === undefined
      ? {}
      : { reasoningTokens: usage.thoughtsTokenCount }),
    ...(usage.totalTokenCount === undefined ? {} : { totalTokens: usage.totalTokenCount }),
  };
}
