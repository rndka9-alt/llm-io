import type { LlmFinishReason } from "../../../core/output";

export function normalizeAnthropicFinishReason(
  reason: string | null | undefined,
): LlmFinishReason | undefined {
  if (reason === undefined || reason === null) {
    return undefined;
  }

  if (reason === "end_turn" || reason === "stop_sequence") {
    return "stop";
  }

  if (reason === "max_tokens") {
    return "length";
  }

  if (reason === "tool_use") {
    return "tool-call";
  }

  if (reason === "refusal") {
    return "content-filter";
  }

  return "unknown";
}
