import type { LlmFinishReason } from "../../../core/output";

export function normalizeOllamaFinishReason(
  reason: string | undefined,
): LlmFinishReason | undefined {
  if (reason === undefined) {
    return undefined;
  }

  if (reason === "stop") {
    return "stop";
  }

  if (reason === "length") {
    return "length";
  }

  return "unknown";
}
