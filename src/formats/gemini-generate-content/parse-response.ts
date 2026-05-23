import { LlmIoError } from "../../core/errors";
import type { LlmOutput } from "../../core/output";
import { createTextAssistantMessage } from "../../core/output";
import { geminiGenerateContentRawSchema, type GeminiGenerateContentRaw } from "./raw-schema";
import { createGeminiUsage } from "./utils/create-gemini-usage";
import { normalizeGeminiFinishReason } from "./utils/normalize-gemini-finish-reason";

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
  const usage = createGeminiUsage(raw.usageMetadata);
  const finishReason = normalizeGeminiFinishReason(firstCandidate?.finishReason);

  return {
    message: createTextAssistantMessage(text),
    ...(reasoningText.length === 0 ? {} : { reasoning: { text: reasoningText } }),
    ...(usage === undefined ? {} : { usage }),
    ...(finishReason === undefined ? {} : { finishReason }),
    raw,
  };
}
