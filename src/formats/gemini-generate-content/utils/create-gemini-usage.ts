import type { LlmUsage } from "../../../core/output";
import type { GeminiGenerateContentRaw } from "../raw-schema";

export function createGeminiUsage(
  usage: GeminiGenerateContentRaw["usageMetadata"],
): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  const details = {
    ...(usage.promptTokensDetails === undefined
      ? {}
      : { promptTokensDetails: usage.promptTokensDetails }),
    ...(usage.candidatesTokensDetails === undefined
      ? {}
      : { candidatesTokensDetails: usage.candidatesTokensDetails }),
    ...(usage.cacheTokensDetails === undefined
      ? {}
      : { cacheTokensDetails: usage.cacheTokensDetails }),
    ...(usage.toolUsePromptTokenCount === undefined
      ? {}
      : { toolUsePromptTokenCount: usage.toolUsePromptTokenCount }),
    ...(usage.trafficType === undefined ? {} : { trafficType: usage.trafficType }),
  };

  return {
    ...(usage.cachedContentTokenCount === undefined
      ? {}
      : { cacheReadInputTokens: usage.cachedContentTokenCount }),
    ...(usage.promptTokenCount === undefined ? {} : { inputTokens: usage.promptTokenCount }),
    ...(usage.candidatesTokenCount === undefined
      ? {}
      : { outputTokens: usage.candidatesTokenCount }),
    ...(usage.thoughtsTokenCount === undefined
      ? {}
      : { reasoningTokens: usage.thoughtsTokenCount }),
    ...(Object.keys(details).length === 0 ? {} : { details }),
    ...(usage.totalTokenCount === undefined ? {} : { totalTokens: usage.totalTokenCount }),
  };
}
