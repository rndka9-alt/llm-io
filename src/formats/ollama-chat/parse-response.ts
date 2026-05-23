import { LlmIoError } from "../../core/errors.js";
import type { LlmFinishReason, LlmOutput, LlmUsage } from "../../core/output.js";
import { createTextAssistantMessage } from "../../core/output.js";
import { ollamaChatRawSchema, type OllamaChatRaw } from "./raw-schema.js";

export interface OllamaChatExtras {
  model?: string;
}

export function parseOllamaChatResponse(responseJson: unknown): LlmOutput<OllamaChatRaw, OllamaChatExtras> {
  const raw = ollamaChatRawSchema.parse(responseJson);
  const text = raw.message?.content;

  if (text === undefined || text.length === 0) {
    throw new LlmIoError("Ollama chat response message.content must be a non-empty string.");
  }

  const reasoningText = raw.message?.thinking;
  const usage = createUsage(raw);
  const finishReason = normalizeFinishReason(raw.done_reason);

  return {
    message: createTextAssistantMessage(text),
    ...(reasoningText === undefined || reasoningText.length === 0 ? {} : { reasoning: { text: reasoningText } }),
    ...(usage === undefined ? {} : { usage }),
    ...(finishReason === undefined ? {} : { finishReason }),
    raw,
    extras: {
      ...(raw.model === undefined ? {} : { model: raw.model }),
    },
  };
}

function createUsage(raw: OllamaChatRaw): LlmUsage | undefined {
  if (raw.prompt_eval_count === undefined && raw.eval_count === undefined) {
    return undefined;
  }

  const totalTokens =
    raw.prompt_eval_count === undefined || raw.eval_count === undefined
      ? undefined
      : raw.prompt_eval_count + raw.eval_count;

  return {
    ...(raw.prompt_eval_count === undefined ? {} : { inputTokens: raw.prompt_eval_count }),
    ...(raw.eval_count === undefined ? {} : { outputTokens: raw.eval_count }),
    ...(totalTokens === undefined ? {} : { totalTokens }),
  };
}

function normalizeFinishReason(reason: string | undefined): LlmFinishReason | undefined {
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
