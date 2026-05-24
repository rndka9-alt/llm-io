import type { LlmUsage } from "../../../core/output";
import { omitUndefined } from "../../../utils/object";
import type { GeminiGenerateContentRaw } from "../raw-schema";

export function createGeminiUsage(
  usage: GeminiGenerateContentRaw["usageMetadata"],
): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  const details = omitUndefined({
    promptTokensDetails: usage.promptTokensDetails,
    candidatesTokensDetails: usage.candidatesTokensDetails,
    cacheTokensDetails: usage.cacheTokensDetails,
    toolUsePromptTokenCount: usage.toolUsePromptTokenCount,
    trafficType: usage.trafficType,
  });

  return omitUndefined({
    cacheReadInputTokens: usage.cachedContentTokenCount,
    inputTokens: usage.promptTokenCount,
    outputTokens: usage.candidatesTokenCount,
    reasoningTokens: usage.thoughtsTokenCount,
    details: Object.keys(details).length === 0 ? undefined : details,
    totalTokens: usage.totalTokenCount,
  });
}
