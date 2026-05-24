import { LlmIoError } from "../../core/errors";
import type { LlmOutput } from "../../core/output";
import { createAssistantMessage, createReasoning } from "../../core/output";
import { undefinedIfEmptyArray } from "../../utils/array";
import { omitUndefined } from "../../utils/object";
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

  return omitUndefined({
    message: createAssistantMessage(text, toolCalls),
    reasoning: createReasoning(reasoningText),
    toolCalls: undefinedIfEmptyArray(toolCalls),
    usage,
    finishReason,
    raw,
  });
}
