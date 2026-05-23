import { LlmIoError } from "../../core/errors.js";
import type { LlmOutput, LlmUsage } from "../../core/output.js";
import { createTextAssistantMessage } from "../../core/output.js";
import { openAIResponsesRawSchema, type OpenAIResponsesRaw } from "./raw-schema.js";
import { readOpenAIResponsesOutputText, readOpenAIResponsesReasoningText } from "./read-output.js";

export interface OpenAIResponsesExtras {
  provider: "openai-responses";
  responseId?: string;
}

export function parseOpenAIResponsesResponse(
  responseJson: unknown,
): LlmOutput<OpenAIResponsesRaw, OpenAIResponsesExtras> {
  const raw = openAIResponsesRawSchema.parse(responseJson);
  const outputItems = raw.output ?? [];
  const text = readOpenAIResponsesOutputText(outputItems);

  if (text.length === 0) {
    throw new LlmIoError("OpenAI responses output must contain output_text content.");
  }

  const reasoningText = readOpenAIResponsesReasoningText(outputItems);
  const reasoning = reasoningText.length === 0 ? undefined : { text: reasoningText };
  const usage = createUsage(raw.usage);

  return {
    message: createTextAssistantMessage(text),
    ...(reasoning === undefined ? {} : { reasoning }),
    ...(usage === undefined ? {} : { usage }),
    raw,
    extras: createExtras(raw),
  };
}

function createUsage(usage: OpenAIResponsesRaw["usage"]): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  const reasoningTokens = usage.output_tokens_details?.reasoning_tokens;

  return {
    ...(usage.input_tokens === undefined ? {} : { inputTokens: usage.input_tokens }),
    ...(usage.output_tokens === undefined ? {} : { outputTokens: usage.output_tokens }),
    ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
    ...(usage.total_tokens === undefined ? {} : { totalTokens: usage.total_tokens }),
  };
}

function createExtras(raw: OpenAIResponsesRaw): OpenAIResponsesExtras {
  return {
    provider: "openai-responses",
    ...(raw.id === undefined ? {} : { responseId: raw.id }),
  };
}
