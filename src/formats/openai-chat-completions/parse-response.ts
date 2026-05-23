import { LlmIoError } from "../../core/errors";
import type { LlmFinishReason, LlmOutput, LlmUsage } from "../../core/output";
import { createTextAssistantMessage } from "../../core/output";
import { openAIChatCompletionsRawSchema, type OpenAIChatCompletionsRaw } from "./raw-schema";

export function parseOpenAIChatCompletionsResponse(
  responseJson: unknown,
): LlmOutput<OpenAIChatCompletionsRaw> {
  const raw = openAIChatCompletionsRawSchema.parse(responseJson);
  const firstChoice = raw.choices[0];

  if (firstChoice === undefined) {
    throw new LlmIoError("OpenAI chat completions response has no choices.");
  }

  const text = firstChoice.message.content;

  if (text === undefined || text === null || text.length === 0) {
    throw new LlmIoError(
      "OpenAI chat completions response message.content must be a non-empty string.",
    );
  }

  const reasoning = createReasoning(
    firstChoice.message.reasoning_content ?? firstChoice.message.reasoning,
  );
  const usage = createUsage(raw.usage);
  const finishReason = normalizeFinishReason(firstChoice.finish_reason);

  return {
    message: createTextAssistantMessage(text),
    ...(reasoning === undefined ? {} : { reasoning }),
    ...(usage === undefined ? {} : { usage }),
    ...(finishReason === undefined ? {} : { finishReason }),
    raw,
  };
}

function createReasoning(text: string | undefined): { text: string } | undefined {
  if (text === undefined || text.length === 0) {
    return undefined;
  }

  return { text };
}

function createUsage(usage: OpenAIChatCompletionsRaw["usage"]): LlmUsage | undefined {
  if (usage === undefined) {
    return undefined;
  }

  return {
    ...(usage.prompt_tokens === undefined ? {} : { inputTokens: usage.prompt_tokens }),
    ...(usage.completion_tokens === undefined ? {} : { outputTokens: usage.completion_tokens }),
    ...(usage.total_tokens === undefined ? {} : { totalTokens: usage.total_tokens }),
  };
}

function normalizeFinishReason(reason: string | null | undefined): LlmFinishReason | undefined {
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
