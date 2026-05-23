import { LlmIoError } from "../../core/errors";
import type { LlmOutput } from "../../core/output";
import { createTextAssistantMessage } from "../../core/output";
import { ollamaChatRawSchema, type OllamaChatRaw } from "./raw-schema";
import { createOllamaUsage } from "./utils/create-ollama-usage";
import { normalizeOllamaFinishReason } from "./utils/normalize-ollama-finish-reason";

export interface OllamaChatExtras {
  model?: string;
}

export function parseOllamaChatResponse(
  responseJson: unknown,
): LlmOutput<OllamaChatRaw, OllamaChatExtras> {
  const raw = ollamaChatRawSchema.parse(responseJson);
  const text = raw.message?.content;

  if (text === undefined || text.length === 0) {
    throw new LlmIoError("Ollama chat response message.content must be a non-empty string.");
  }

  const reasoningText = raw.message?.thinking;
  const usage = createOllamaUsage(raw);
  const finishReason = normalizeOllamaFinishReason(raw.done_reason);

  return {
    message: createTextAssistantMessage(text),
    ...(reasoningText === undefined || reasoningText.length === 0
      ? {}
      : { reasoning: { text: reasoningText } }),
    ...(usage === undefined ? {} : { usage }),
    ...(finishReason === undefined ? {} : { finishReason }),
    raw,
    extras: {
      ...(raw.model === undefined ? {} : { model: raw.model }),
    },
  };
}
