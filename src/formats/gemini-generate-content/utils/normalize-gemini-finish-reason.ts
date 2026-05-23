import type { LlmFinishReason } from "../../../core/output";

export function normalizeGeminiFinishReason(
  reason: string | undefined,
): LlmFinishReason | undefined {
  if (reason === undefined) {
    return undefined;
  }

  if (reason === "STOP") {
    return "stop";
  }

  if (reason === "MAX_TOKENS") {
    return "length";
  }

  if (
    reason === "SAFETY" ||
    reason === "RECITATION" ||
    reason === "SPII" ||
    reason === "BLOCKLIST"
  ) {
    return "content-filter";
  }

  return "unknown";
}
