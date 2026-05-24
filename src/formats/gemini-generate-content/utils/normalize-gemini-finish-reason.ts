import type { LlmFinishReason } from "../../../core/output";

export function normalizeGeminiFinishReason(
  reason: string | undefined,
): LlmFinishReason | undefined {
  if (reason === undefined) {
    return undefined;
  }

  if (reason === "STOP" || reason === "FINISH_REASON_STOP") {
    return "stop";
  }

  if (reason === "MAX_TOKENS" || reason === "FINISH_REASON_MAX_TOKENS") {
    return "length";
  }

  if (
    reason === "SAFETY" ||
    reason === "FINISH_REASON_SAFETY" ||
    reason === "RECITATION" ||
    reason === "FINISH_REASON_RECITATION" ||
    reason === "SPII" ||
    reason === "FINISH_REASON_SPII" ||
    reason === "BLOCKLIST" ||
    reason === "FINISH_REASON_BLOCKLIST" ||
    reason === "PROHIBITED_CONTENT" ||
    reason === "FINISH_REASON_PROHIBITED_CONTENT" ||
    reason === "IMAGE_PROHIBITED_CONTENT" ||
    reason === "FINISH_REASON_IMAGE_PROHIBITED_CONTENT"
  ) {
    return "content-filter";
  }

  if (reason === "MALFORMED_FUNCTION_CALL" || reason === "FINISH_REASON_MALFORMED_FUNCTION_CALL") {
    return "tool-call";
  }

  return "unknown";
}
