import { LlmIoError } from "../../core/errors";
import type { LlmOutput } from "../../core/output";
import { createAssistantMessage } from "../../core/output";
import { geminiGenerateContentRawSchema, type GeminiGenerateContentRaw } from "./raw-schema";
import { createGeminiToolCalls } from "./utils/create-gemini-tool-calls";
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
  const toolCalls = createGeminiToolCalls(parts);

  if (text.length === 0 && toolCalls.length === 0) {
    throw new LlmIoError(
      "Gemini generateContent response must contain non-thinking text content or tool calls.",
    );
  }

  const reasoningText = parts
    .filter((part) => part.thought === true)
    .map((part) => part.text ?? "")
    .join("");
  const usage = createGeminiUsage(raw.usageMetadata);
  const finishReason = normalizeGeminiFinishReason(firstCandidate?.finishReason);

  return {
    message: createAssistantMessage(text, toolCalls),
    ...(reasoningText.length === 0 ? {} : { reasoning: { text: reasoningText } }),
    ...(toolCalls.length === 0 ? {} : { toolCalls }),
    ...(usage === undefined ? {} : { usage }),
    ...(finishReason === undefined ? {} : { finishReason }),
    raw,
  };
}
