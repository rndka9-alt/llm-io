import { LlmIoError } from "../../core/errors.js";
import type { LlmFinishReason, LlmOutput, LlmUsage } from "../../core/output.js";
import { createTextAssistantMessage } from "../../core/output.js";
import { geminiGenerateContentRawSchema, type GeminiGenerateContentRaw } from "./raw-schema.js";

export function parseGeminiGenerateContentResponse(
  responseJson: unknown,
): LlmOutput<GeminiGenerateContentRaw> {
  const raw = geminiGenerateContentRawSchema.parse(responseJson);
  const firstCandidate = raw.candidates?.[0];
  const parts = firstCandidate?.content?.parts ?? [];
  const text = parts
    .filter((part) => part.thought !== true)
    .map((part) => part.text ?? "")
    .join("");

  if (text.length === 0) {
    throw new LlmIoError("Gemini generateContent response must contain non-thinking text content.");
  }

  const reasoningText = parts
    .filter((part) => part.thought === true)
    .map((part) => part.text ?? "")
    .join("");
  const usage = createUsage(raw.usageMetadata);
  const finishReason = normalizeFinishReason(firstCandidate?.finishReason);

  return {
    message: createTextAssistantMessage(text),
    ...(reasoningText.length === 0 ? {} : { reasoning: { text: reasoningText } }),
    ...(usage === undefined ? {} : { usage }),
    ...(finishReason === undefined ? {} : { finishReason }),
    raw,
  };
}

function createUsage(usage: GeminiGenerateContentRaw["usageMetadata"]): LlmUsage | undefined {
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

function normalizeFinishReason(reason: string | undefined): LlmFinishReason | undefined {
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
