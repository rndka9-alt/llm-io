import { LlmIoError } from "../../core/errors";
import type { LlmOutput } from "../../core/output";
import { createAssistantMessage } from "../../core/output";
import { ollamaChatRawSchema, type OllamaChatRaw } from "./raw-schema";
import { createOllamaToolCalls } from "./utils/create-ollama-tool-calls";
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
  const toolCalls = createOllamaToolCalls(raw.message);

  if ((text === undefined || text.length === 0) && toolCalls.length === 0) {
    throw new LlmIoError("Ollama chat response message must contain text content or tool calls.");
  }

  const reasoningText = raw.message?.thinking;
  const usage = createOllamaUsage(raw);
  const finishReason = normalizeOllamaFinishReason(raw.done_reason);

  return {
    message: createAssistantMessage(text ?? "", toolCalls),
    ...(reasoningText === undefined || reasoningText.length === 0
      ? {}
      : { reasoning: { text: reasoningText } }),
    ...(toolCalls.length === 0 ? {} : { toolCalls }),
    ...(usage === undefined ? {} : { usage }),
    ...(finishReason === undefined ? {} : { finishReason }),
    raw,
    extras: {
      ...(raw.model === undefined ? {} : { model: raw.model }),
    },
  };
}
