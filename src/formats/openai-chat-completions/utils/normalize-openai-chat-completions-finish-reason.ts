import type { LlmFinishReason } from "../../../core/output";

export function normalizeOpenAIChatCompletionsFinishReason(
  reason: string | null | undefined,
): LlmFinishReason | undefined {
  if (reason === undefined || reason === null) {
    return undefined;
  }

  if (reason === "stop") {
    return "stop";
  }

  if (reason === "length") {
    return "length";
  }

  if (reason === "content_filter") {
    return "content-filter";
  }

  if (reason === "tool_calls" || reason === "function_call") {
    return "tool-call";
  }

  return "unknown";
}
