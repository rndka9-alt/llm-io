import { LlmIoError } from "../../core/errors";
import type { LlmOutput } from "../../core/output";
import { createTextAssistantMessage } from "../../core/output";
import { openAIChatCompletionsRawSchema, type OpenAIChatCompletionsRaw } from "./raw-schema";
import { createOpenAIChatCompletionsReasoning } from "./utils/create-openai-chat-completions-reasoning";
import { createOpenAIChatCompletionsUsage } from "./utils/create-openai-chat-completions-usage";
import { normalizeOpenAIChatCompletionsFinishReason } from "./utils/normalize-openai-chat-completions-finish-reason";

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

  const reasoning = createOpenAIChatCompletionsReasoning(
    firstChoice.message.reasoning_content ?? firstChoice.message.reasoning,
  );
  const usage = createOpenAIChatCompletionsUsage(raw.usage);
  const finishReason = normalizeOpenAIChatCompletionsFinishReason(firstChoice.finish_reason);

  return {
    message: createTextAssistantMessage(text),
    ...(reasoning === undefined ? {} : { reasoning }),
    ...(usage === undefined ? {} : { usage }),
    ...(finishReason === undefined ? {} : { finishReason }),
    raw,
  };
}
