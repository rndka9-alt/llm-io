import { LlmIoError } from "../../core/errors";
import type { LlmOutput } from "../../core/output";
import { createAssistantMessage, createReasoning } from "../../core/output";
import { undefinedIfEmptyArray } from "../../utils/array";
import { omitUndefined } from "../../utils/object";
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

  return omitUndefined({
    message: createAssistantMessage(text ?? "", toolCalls),
    reasoning: createReasoning(reasoningText),
    toolCalls: undefinedIfEmptyArray(toolCalls),
    usage,
    finishReason,
    raw,
    extras: omitUndefined({ model: raw.model }),
  });
}
